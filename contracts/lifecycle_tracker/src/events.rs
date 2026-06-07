use soroban_sdk::{Address, Env, Symbol};

use shared::types::LifecycleStage;

pub fn lifecycle_event_recorded(
    env: &Env,
    product_id: u64,
    event_id: u64,
    stage: &LifecycleStage,
    actor: &Address,
    emissions: i128,
    timestamp: u64,
) {
    env.events().publish(
        (Symbol::new(env, "lifecycle_event_recorded"),),
        (
            product_id,
            event_id,
            stage.clone(),
            actor.clone(),
            emissions,
            timestamp,
        ),
    );
}

pub fn batch_events_recorded(
    env: &Env,
    product_id: u64,
    count: u64,
    timestamp: u64,
) {
    env.events().publish(
        (Symbol::new(env, "batch_events_recorded"),),
        (product_id, count, timestamp),
    );
}

pub fn milestone_updated(
    env: &Env,
    product_id: u64,
    stage: &LifecycleStage,
    completed: bool,
) {
    env.events().publish(
        (Symbol::new(env, "milestone_updated"),),
        (product_id, stage.clone(), completed),
    );
}
