use soroban_sdk::{Address, Env, Map, Vec};

use crate::types::{LifecycleEvent, LifecycleStage, MilestoneConfig};

pub struct LifecycleStore;

impl LifecycleStore {
    pub fn events(env: &Env) -> Map<(u64, u64), LifecycleEvent> {
        env.storage()
            .instance()
            .get(&"events")
            .unwrap_or(Map::new(env))
    }

    pub fn set_events(env: &Env, events: &Map<(u64, u64), LifecycleEvent>) {
        env.storage().instance().set(&"events", events);
    }

    pub fn event(env: &Env, product_id: u64, event_id: u64) -> Option<LifecycleEvent> {
        let events = Self::events(env);
        events.get((product_id, event_id))
    }

    pub fn set_event(env: &Env, product_id: u64, event: &LifecycleEvent) {
        let mut events = Self::events(env);
        events.set((product_id, event.id), event.clone());
        Self::set_events(env, &events);
    }

    pub fn product_event_ids(env: &Env) -> Map<u64, Vec<u64>> {
        env.storage()
            .instance()
            .get(&"product_event_ids")
            .unwrap_or(Map::new(env))
    }

    pub fn set_product_event_ids(env: &Env, map: &Map<u64, Vec<u64>>) {
        env.storage().instance().set(&"product_event_ids", map);
    }

    pub fn add_event_id(env: &Env, product_id: u64, event_id: u64) {
        let mut map = Self::product_event_ids(env);
        let mut ids = map.get(product_id).unwrap_or(Vec::new(env));
        ids.push_back(event_id);
        map.set(product_id, ids);
        Self::set_product_event_ids(env, &map);
    }

    pub fn next_event_id(env: &Env) -> u64 {
        env.storage().instance().get(&"next_event_id").unwrap_or(1u64)
    }

    pub fn set_next_event_id(env: &Env, id: u64) {
        env.storage().instance().set(&"next_event_id", &id);
    }

    pub fn milestone_configs(env: &Env) -> Map<LifecycleStage, MilestoneConfig> {
        env.storage()
            .instance()
            .get(&"milestone_configs")
            .unwrap_or(Map::new(env))
    }

    pub fn set_milestone_configs(env: &Env, configs: &Map<LifecycleStage, MilestoneConfig>) {
        env.storage().instance().set(&"milestone_configs", configs);
    }

    pub fn carbon_oracle(env: &Env) -> Option<Address> {
        env.storage().instance().get(&"carbon_oracle")
    }

    pub fn set_carbon_oracle(env: &Env, address: &Address) {
        env.storage().instance().set(&"carbon_oracle", address);
    }

    pub fn events_for_product(env: &Env, product_id: u64) -> Vec<LifecycleEvent> {
        let map = Self::product_event_ids(env);
        let ids = map.get(product_id).unwrap_or(Vec::new(env));
        let events_store = Self::events(env);
        let mut result = Vec::new(env);
        for id in ids.iter() {
            if let Some(event) = events_store.get((product_id, id)) {
                result.push_back(event);
            }
        }
        result
    }
}
