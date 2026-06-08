#![no_std]

pub mod dissent;
pub mod escalation;
pub mod types;

use soroban_sdk::{contract, contractimpl, Address, Env, String, Vec};

use shared::constants::ATTESTATION_QUORUM;
use shared::errors::Error;
use shared::types::AttestationStatus;

use crate::dissent::record_dissent;
use crate::escalation::{escalate_verifiers, BASE_QUORUM};
use crate::types::AttestationRecord;

#[contract]
pub struct AttestationContract;

#[contractimpl]
impl AttestationContract {
    pub fn submit_for_attestation(
        env: Env,
        submitter: Address,
        product_id: u64,
        verifiers: Vec<Address>,
        evidence_ipfs_hash: String,
    ) -> Result<u64, Error> {
        submitter.require_auth();

        if verifiers.len() < BASE_QUORUM {
            return Err(Error::InsufficientVerifiers);
        }

        if evidence_ipfs_hash.len() == 0 {
            return Err(Error::InvalidInput);
        }

        let id = Self::next_attestation_id(&env);

        let record = AttestationRecord {
            id,
            product_id,
            submitter: submitter.clone(),
            verifiers: verifiers.clone(),
            approvals: Vec::new(&env),
            rejections: Vec::new(&env),
            status: AttestationStatus::Pending,
            evidence_ipfs_hash: evidence_ipfs_hash.clone(),
            submitted_at: env.ledger().timestamp(),
            resolved_at: 0,
            dissenting_opinions: Vec::new(&env),
        };

        Self::save_attestation(&env, id, &record);
        Self::add_to_product_index(&env, product_id, id);
        Self::add_to_verifier_pending(&env, &verifiers, id);
        Self::set_next_attestation_id(&env, id + 1);

        env.events().publish(
            (soroban_sdk::Symbol::new(&env, "attestation_submitted"),),
            (id, product_id, submitter, verifiers),
        );

        Ok(id)
    }

    pub fn approve_attestation(
        env: Env,
        verifier: Address,
        attestation_id: u64,
    ) -> Result<(), Error> {
        verifier.require_auth();

        let mut record = Self::load_attestation(&env, attestation_id)
            .ok_or(Error::AttestationNotFound)?;

        if record.status != AttestationStatus::Pending {
            return Err(Error::AttestationNotPending);
        }

        if !Self::is_assigned_verifier(&record, &verifier) {
            return Err(Error::Unauthorized);
        }

        if Self::has_voted(&record, &verifier) {
            return Err(Error::AlreadyVoted);
        }

        let mut approvals = record.approvals.clone();
        approvals.push_back(verifier.clone());
        record.approvals = approvals;

        let approval_count: u32 = record.approvals.len() as u32;
        if approval_count >= ATTESTATION_QUORUM {
            record.status = AttestationStatus::Approved;
            record.resolved_at = env.ledger().timestamp();
            Self::remove_from_verifier_pending(&env, &verifier, attestation_id);

            env.events().publish(
                (soroban_sdk::Symbol::new(&env, "attestation_approved"),),
                (attestation_id, verifier, approval_count),
            );
        }

        Self::save_attestation(&env, attestation_id, &record);
        Ok(())
    }

    pub fn reject_attestation(
        env: Env,
        verifier: Address,
        attestation_id: u64,
        reason: String,
    ) -> Result<(), Error> {
        verifier.require_auth();

        let mut record = Self::load_attestation(&env, attestation_id)
            .ok_or(Error::AttestationNotFound)?;

        if record.status != AttestationStatus::Pending {
            return Err(Error::AttestationNotPending);
        }

        if !Self::is_assigned_verifier(&record, &verifier) {
            return Err(Error::Unauthorized);
        }

        if Self::has_voted(&record, &verifier) {
            return Err(Error::AlreadyVoted);
        }

        let mut rejections = record.rejections.clone();
        rejections.push_back(verifier.clone());
        record.rejections = rejections;

        record_dissent(&env, &mut record, verifier.clone(), reason.clone());

        let rejection_count: u32 = record.rejections.len() as u32;
        if rejection_count >= ATTESTATION_QUORUM {
            record.status = AttestationStatus::Rejected;
            record.resolved_at = env.ledger().timestamp();

            env.events().publish(
                (soroban_sdk::Symbol::new(&env, "attestation_rejected"),),
                (attestation_id, verifier, rejection_count),
            );
        }

        Self::save_attestation(&env, attestation_id, &record);
        Ok(())
    }

    pub fn escalate_attestation(
        env: Env,
        caller: Address,
        attestation_id: u64,
        additional_verifiers: Vec<Address>,
    ) -> Result<(), Error> {
        caller.require_auth();

        let mut record = Self::load_attestation(&env, attestation_id)
            .ok_or(Error::AttestationNotFound)?;

        if record.status != AttestationStatus::Pending {
            return Err(Error::AttestationNotPending);
        }

        if caller != record.submitter {
            return Err(Error::Unauthorized);
        }

        let expanded = escalate_verifiers(&env, &record.verifiers, &additional_verifiers);
        record.verifiers = expanded.clone();
        record.status = AttestationStatus::Escalated;

        Self::add_to_verifier_pending(&env, &additional_verifiers, attestation_id);
        Self::save_attestation(&env, attestation_id, &record);

        env.events().publish(
            (soroban_sdk::Symbol::new(&env, "attestation_escalated"),),
            (attestation_id, caller, expanded),
        );

        Ok(())
    }

    pub fn get_attestation(
        env: Env,
        attestation_id: u64,
    ) -> Result<AttestationRecord, Error> {
        Self::load_attestation(&env, attestation_id).ok_or(Error::AttestationNotFound)
    }

    pub fn get_attestations_for_product(
        env: Env,
        product_id: u64,
    ) -> Vec<AttestationRecord> {
        let index = Self::product_attestations(&env);
        let ids = index.get(product_id).unwrap_or(Vec::new(&env));
        let mut results = Vec::new(&env);
        for id in ids.iter() {
            if let Some(record) = Self::load_attestation(&env, id) {
                results.push_back(record);
            }
        }
        results
    }

    pub fn get_pending_for_verifier(
        env: Env,
        verifier: Address,
    ) -> Vec<AttestationRecord> {
        let index = Self::verifier_pending(&env);
        let ids = index.get(verifier).unwrap_or(Vec::new(&env));
        let mut results = Vec::new(&env);
        for id in ids.iter() {
            if let Some(record) = Self::load_attestation(&env, id) {
                if record.status == AttestationStatus::Pending
                    || record.status == AttestationStatus::Escalated
                {
                    results.push_back(record);
                }
            }
        }
        results
    }
}

// Storage helpers
#[contractimpl]
impl AttestationContract {
    fn next_attestation_id(env: &Env) -> u64 {
        env.storage()
            .instance()
            .get(&"next_id")
            .unwrap_or(1u64)
    }

    fn set_next_attestation_id(env: &Env, id: u64) {
        env.storage().instance().set(&"next_id", &id);
    }

    fn attestations(env: &Env) -> soroban_sdk::Map<u64, AttestationRecord> {
        env.storage()
            .instance()
            .get(&"attestations")
            .unwrap_or(soroban_sdk::Map::new(env))
    }

    fn set_attestations(env: &Env, map: &soroban_sdk::Map<u64, AttestationRecord>) {
        env.storage().instance().set(&"attestations", map);
    }

    fn load_attestation(env: &Env, id: u64) -> Option<AttestationRecord> {
        let map = Self::attestations(env);
        map.get(id)
    }

    fn save_attestation(env: &Env, id: u64, record: &AttestationRecord) {
        let mut map = Self::attestations(env);
        map.set(id, record.clone());
        Self::set_attestations(env, &map);
    }

    fn product_attestations(env: &Env) -> soroban_sdk::Map<u64, Vec<u64>> {
        env.storage()
            .instance()
            .get(&"product_attestations")
            .unwrap_or(soroban_sdk::Map::new(env))
    }

    fn set_product_attestations(env: &Env, map: &soroban_sdk::Map<u64, Vec<u64>>) {
        env.storage().instance().set(&"product_attestations", map);
    }

    fn add_to_product_index(env: &Env, product_id: u64, attestation_id: u64) {
        let mut map = Self::product_attestations(env);
        let mut ids = map.get(product_id).unwrap_or(Vec::new(env));
        ids.push_back(attestation_id);
        map.set(product_id, ids);
        Self::set_product_attestations(env, &map);
    }

    fn verifier_pending(env: &Env) -> soroban_sdk::Map<Address, Vec<u64>> {
        env.storage()
            .instance()
            .get(&"verifier_pending")
            .unwrap_or(soroban_sdk::Map::new(env))
    }

    fn set_verifier_pending(env: &Env, map: &soroban_sdk::Map<Address, Vec<u64>>) {
        env.storage().instance().set(&"verifier_pending", map);
    }

    fn add_to_verifier_pending(env: &Env, verifiers: &Vec<Address>, attestation_id: u64) {
        let mut map = Self::verifier_pending(env);
        for v in verifiers.iter() {
            let mut ids = map.get(v.clone()).unwrap_or(Vec::new(env));
            ids.push_back(attestation_id);
            map.set(v.clone(), ids);
        }
        Self::set_verifier_pending(env, &map);
    }

    fn remove_from_verifier_pending(env: &Env, verifier: &Address, attestation_id: u64) {
        let mut map = Self::verifier_pending(env);
        if let Some(ids) = map.get(verifier.clone()) {
            let mut filtered = Vec::new(env);
            for id in ids.iter() {
                if id != attestation_id {
                    filtered.push_back(id);
                }
            }
            map.set(verifier.clone(), filtered);
        }
        Self::set_verifier_pending(env, &map);
    }

    fn is_assigned_verifier(record: &AttestationRecord, verifier: &Address) -> bool {
        for v in record.verifiers.iter() {
            if v == *verifier {
                return true;
            }
        }
        false
    }

    fn has_voted(record: &AttestationRecord, verifier: &Address) -> bool {
        for v in record.approvals.iter() {
            if v == *verifier {
                return true;
            }
        }
        for v in record.rejections.iter() {
            if v == *verifier {
                return true;
            }
        }
        false
    }
}
