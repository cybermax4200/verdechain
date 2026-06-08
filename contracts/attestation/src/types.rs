use soroban_sdk::{contracttype, Address, String, Vec};

use shared::types::AttestationStatus;

use crate::dissent::DissentingOpinion;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AttestationRecord {
    pub id: u64,
    pub product_id: u64,
    pub submitter: Address,
    pub verifiers: Vec<Address>,
    pub approvals: Vec<Address>,
    pub rejections: Vec<Address>,
    pub status: AttestationStatus,
    pub evidence_ipfs_hash: String,
    pub submitted_at: u64,
    pub resolved_at: u64,
    pub dissenting_opinions: Vec<DissentingOpinion>,
}
