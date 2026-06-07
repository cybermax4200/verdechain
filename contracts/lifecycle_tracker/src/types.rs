use soroban_sdk::{contracttype, Address, Map, String, Vec};

pub use shared::types::LifecycleStage;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LifecycleEventData {
    pub stage: LifecycleStage,
    pub actor: Address,
    pub location: String,
    pub description: String,
    pub energy_used: i128,
    pub fuel_used: i128,
    pub waste_generated: i128,
    pub metadata_ipfs: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LifecycleEvent {
    pub id: u64,
    pub product_id: u64,
    pub stage: LifecycleStage,
    pub actor: Address,
    pub timestamp: u64,
    pub location: String,
    pub description: String,
    pub energy_used: i128,
    pub fuel_used: i128,
    pub waste_generated: i128,
    pub emissions: i128,
    pub metadata_ipfs: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LifecycleSummary {
    pub product_id: u64,
    pub total_events: u32,
    pub stages_completed: Vec<LifecycleStage>,
    pub total_emissions: i128,
    pub stages_breakdown: Map<LifecycleStage, i128>,
    pub last_updated: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EmissionsSummary {
    pub product_id: u64,
    pub total_emissions: i128,
    pub energy_emissions: i128,
    pub fuel_emissions: i128,
    pub waste_emissions: i128,
    pub stages_breakdown: Map<LifecycleStage, i128>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MilestoneConfig {
    pub stage: LifecycleStage,
    pub required: bool,
    pub max_duration: u64,
}
