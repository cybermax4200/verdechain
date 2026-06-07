use soroban_sdk::{Env, Map, Vec};

use shared::errors::Error;
use shared::types::LifecycleStage;

use crate::storage::LifecycleStore;
use crate::types::LifecycleEvent;

const STAGE_ORDER: [LifecycleStage; 8] = [
    LifecycleStage::RawMaterialExtraction,
    LifecycleStage::Transportation,
    LifecycleStage::Manufacturing,
    LifecycleStage::Packaging,
    LifecycleStage::Distribution,
    LifecycleStage::Retail,
    LifecycleStage::Use,
    LifecycleStage::EndOfLife,
];

fn stage_index(stage: &LifecycleStage) -> Option<u32> {
    for (i, s) in STAGE_ORDER.iter().enumerate() {
        if s == stage {
            return Some(i as u32);
        }
    }
    None
}

pub fn validate_stage_sequence(
    _env: &Env,
    _product_id: u64,
    new_stage: &LifecycleStage,
    events: &Vec<LifecycleEvent>,
) -> Result<(), Error> {
    let new_idx = match stage_index(new_stage) {
        Some(i) => i,
        None => return Ok(()),
    };

    let mut max_prev_idx: Option<u32> = None;
    for event in events.iter() {
        if let Some(idx) = stage_index(&event.stage) {
            if idx > new_idx {
                return Err(Error::StageMismatch);
            }
            max_prev_idx = Some(match max_prev_idx {
                Some(prev) => prev.max(idx),
                None => idx,
            });
        }
    }

    if let Some(max_idx) = max_prev_idx {
        if new_idx > max_idx + 1 {
            return Err(Error::StageMismatch);
        }
    }

    Ok(())
}

pub fn get_completed_stages(
    env: &Env,
    product_id: u64,
) -> Vec<LifecycleStage> {
    let events = LifecycleStore::events_for_product(env, product_id);
    let mut seen = Map::new(env);
    let mut result = Vec::new(env);

    for event in events.iter() {
        if !seen.contains_key(event.stage.clone()) {
            seen.set(event.stage.clone(), true);
            result.push_back(event.stage);
        }
    }

    result
}

pub fn check_required_stages(
    env: &Env,
    product_id: u64,
) -> Result<(), Error> {
    let configs = LifecycleStore::milestone_configs(env);
    let events = LifecycleStore::events_for_product(env, product_id);

    let mut completed = Map::new(env);
    for event in events.iter() {
        completed.set(event.stage.clone(), true);
    }

    for (stage, config) in configs.iter() {
        if config.required && !completed.contains_key(stage) {
            return Err(Error::StageMismatch);
        }
    }

    Ok(())
}
