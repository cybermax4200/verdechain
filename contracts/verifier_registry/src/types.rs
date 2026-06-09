use soroban_sdk::{contracttype, Address, String};

use shared::types::VerifierStatus;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VerifierRecord {
    pub id: u64,
    pub verifier: Address,
    pub admin: Address,
    pub name: String,
    pub status: VerifierStatus,
    pub registered_at: u64,
    pub last_active: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StakeRecord {
    pub amount: i128,
    pub locked_until: u64,
    pub withdrawal_requested_at: u64,
    pub cooldown_start: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReputationScore {
    pub verifier_id: u64,
    pub accuracy_score: u32,
    pub timeliness_score: u32,
    pub volume_score: u32,
    pub peer_review_score: u32,
    pub longevity_score: u32,
    pub overall_score: u32,
    pub total_attestations: u32,
    pub successful_attestations: u32,
    pub failed_attestations: u32,
    pub last_updated: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InsurancePool {
    pub total_balance: i128,
    pub total_premiums_collected: i128,
    pub total_payouts: i128,
    pub active_policies: u32,
}
