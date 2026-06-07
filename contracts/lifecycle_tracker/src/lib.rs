#![no_std]

pub mod emissions;
pub mod events;
pub mod milestones;
mod storage;
pub mod types;

use soroban_sdk::{contract, contractimpl, Address, Env, Map, Vec};

use shared::errors::Error;
use shared::types::LifecycleStage;

use crate::emissions::compute_emissions;
use crate::events::{
    batch_events_recorded, lifecycle_event_recorded,
};
use crate::milestones::{get_completed_stages, validate_stage_sequence};
use crate::storage::LifecycleStore;
use crate::types::{
    EmissionsSummary, LifecycleEvent, LifecycleEventData, LifecycleSummary, MilestoneConfig,
};

#[contract]
pub struct LifecycleTrackerContract;

#[contractimpl]
impl LifecycleTrackerContract {
    pub fn record_event(
        env: Env,
        caller: Address,
        product_id: u64,
        data: LifecycleEventData,
    ) -> Result<u64, Error> {
        caller.require_auth();
        validate_event_data(&data)?;

        let events = LifecycleStore::events_for_product(&env, product_id);
        validate_stage_sequence(&env, product_id, &data.stage, &events)?;

        let event_id = LifecycleStore::next_event_id(&env);

        let emissions = compute_emissions(
            &env,
            &data.stage,
            data.energy_used,
            data.fuel_used,
            data.waste_generated,
        );

        let timestamp = env.ledger().timestamp();

        let event = LifecycleEvent {
            id: event_id,
            product_id,
            stage: data.stage.clone(),
            actor: data.actor.clone(),
            timestamp,
            location: data.location,
            description: data.description,
            energy_used: data.energy_used,
            fuel_used: data.fuel_used,
            waste_generated: data.waste_generated,
            emissions,
            metadata_ipfs: data.metadata_ipfs,
        };

        LifecycleStore::set_event(&env, product_id, &event);
        LifecycleStore::add_event_id(&env, product_id, event_id);
        LifecycleStore::set_next_event_id(&env, event_id + 1);

        lifecycle_event_recorded(
            &env,
            product_id,
            event_id,
            &event.stage,
            &event.actor,
            emissions,
            timestamp,
        );

        Ok(event_id)
    }

    pub fn get_lifecycle(env: Env, product_id: u64) -> Result<LifecycleSummary, Error> {
        let events = LifecycleStore::events_for_product(&env, product_id);
        if events.len() == 0 {
            return Err(Error::EventNotFound);
        }

        let stages_completed = get_completed_stages(&env, product_id);
        let mut total_emissions: i128 = 0;
        let mut stages_breakdown: Map<LifecycleStage, i128> = Map::new(&env);
        let mut last_updated: u64 = 0;

        for event in events.iter() {
            total_emissions += event.emissions;
            let current = stages_breakdown
                .get(event.stage.clone())
                .unwrap_or(0i128);
            stages_breakdown.set(event.stage.clone(), current + event.emissions);
            if event.timestamp > last_updated {
                last_updated = event.timestamp;
            }
        }

        Ok(LifecycleSummary {
            product_id,
            total_events: events.len(),
            stages_completed,
            total_emissions,
            stages_breakdown,
            last_updated,
        })
    }

    pub fn get_event(
        env: Env,
        product_id: u64,
        event_id: u64,
    ) -> Result<LifecycleEvent, Error> {
        LifecycleStore::event(&env, product_id, event_id).ok_or(Error::EventNotFound)
    }

    pub fn get_event_count(env: Env, product_id: u64) -> u32 {
        let map = LifecycleStore::product_event_ids(&env);
        map.get(product_id).unwrap_or(Vec::new(&env)).len()
    }

    pub fn get_emissions_summary(
        env: Env,
        product_id: u64,
    ) -> Result<EmissionsSummary, Error> {
        let events = LifecycleStore::events_for_product(&env, product_id);
        if events.len() == 0 {
            return Err(Error::EventNotFound);
        }

        let mut total_emissions: i128 = 0;
        let mut energy_emissions: i128 = 0;
        let mut fuel_emissions: i128 = 0;
        let mut waste_emissions: i128 = 0;
        let mut stages_breakdown: Map<LifecycleStage, i128> = Map::new(&env);

        for event in events.iter() {
            total_emissions += event.emissions;
            energy_emissions += event.energy_used * 475 / 1000;
            fuel_emissions += event.fuel_used * 2680 / 1000;
            waste_emissions += event.waste_generated * 700 / 1000;
            let current = stages_breakdown
                .get(event.stage.clone())
                .unwrap_or(0i128);
            stages_breakdown.set(event.stage.clone(), current + event.emissions);
        }

        Ok(EmissionsSummary {
            product_id,
            total_emissions,
            energy_emissions,
            fuel_emissions,
            waste_emissions,
            stages_breakdown,
        })
    }

    pub fn batch_record_events(
        env: Env,
        caller: Address,
        product_id: u64,
        batch: Vec<LifecycleEventData>,
    ) -> Result<u64, Error> {
        caller.require_auth();

        let mut count: u64 = 0;
        let timestamp = env.ledger().timestamp();

        for data in batch.iter() {
            validate_event_data(&data)?;
        }

        for data in batch.iter() {
            let events_so_far = LifecycleStore::events_for_product(&env, product_id);
            validate_stage_sequence(&env, product_id, &data.stage, &events_so_far)?;

            let event_id = LifecycleStore::next_event_id(&env);

            let emissions = compute_emissions(
                &env,
                &data.stage,
                data.energy_used,
                data.fuel_used,
                data.waste_generated,
            );

            let event = LifecycleEvent {
                id: event_id,
                product_id,
                stage: data.stage.clone(),
                actor: data.actor.clone(),
                timestamp,
                location: data.location,
                description: data.description,
                energy_used: data.energy_used,
                fuel_used: data.fuel_used,
                waste_generated: data.waste_generated,
                emissions,
                metadata_ipfs: data.metadata_ipfs,
            };

            LifecycleStore::set_event(&env, product_id, &event);
            LifecycleStore::add_event_id(&env, product_id, event_id);
            LifecycleStore::set_next_event_id(&env, event_id + 1);

            lifecycle_event_recorded(
                &env,
                product_id,
                event_id,
                &event.stage,
                &event.actor,
                emissions,
                timestamp,
            );

            count += 1;
        }

        batch_events_recorded(&env, product_id, count, timestamp);

        Ok(count)
    }

    pub fn set_milestone_config(
        env: Env,
        admin: Address,
        stage: LifecycleStage,
        config: MilestoneConfig,
    ) -> Result<(), Error> {
        admin.require_auth();
        let mut configs = LifecycleStore::milestone_configs(&env);
        configs.set(stage, config);
        LifecycleStore::set_milestone_configs(&env, &configs);
        Ok(())
    }

    pub fn set_carbon_oracle(env: Env, admin: Address, oracle: Address) -> Result<(), Error> {
        admin.require_auth();
        LifecycleStore::set_carbon_oracle(&env, &oracle);
        Ok(())
    }
}

fn validate_event_data(data: &LifecycleEventData) -> Result<(), Error> {
    if data.location.len() == 0 {
        return Err(Error::InvalidEventData);
    }
    if data.description.len() == 0 {
        return Err(Error::InvalidEventData);
    }
    if data.energy_used < 0 || data.fuel_used < 0 || data.waste_generated < 0 {
        return Err(Error::InvalidEventData);
    }
    Ok(())
}
