use soroban_sdk::{contracttype, Address, Env, String, Vec};

use crate::types::AttestationRecord;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DissentingOpinion {
    pub verifier: Address,
    pub reason: String,
    pub timestamp: u64,
}

pub fn record_dissent(
    env: &Env,
    record: &mut AttestationRecord,
    verifier: Address,
    reason: String,
) {
    let opinion = DissentingOpinion {
        verifier: verifier.clone(),
        reason: reason.clone(),
        timestamp: env.ledger().timestamp(),
    };
    let mut opinions = record.dissenting_opinions.clone();
    opinions.push_back(opinion);
    record.dissenting_opinions = opinions;
}

pub fn get_dissenting_opinions(record: &AttestationRecord) -> Vec<DissentingOpinion> {
    record.dissenting_opinions.clone()
}

pub fn has_verifier_dissented(record: &AttestationRecord, verifier: &Address) -> bool {
    for opinion in record.dissenting_opinions.iter() {
        if opinion.verifier == *verifier {
            return true;
        }
    }
    false
}
