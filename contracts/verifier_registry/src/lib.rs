#![no_std]

pub mod insurance;
pub mod reputation;
pub mod staking;
pub mod types;

use soroban_sdk::{contract, contractimpl, Address, Env, String, Vec};

use shared::errors::Error;

use crate::staking::{
    add_stake, complete_stake_withdrawal, get_all_verifiers, get_stake, get_verifier_by_address,
    get_verifier_record, register_verifier, request_stake_withdrawal, update_last_active,
};
use crate::types::{InsurancePool, ReputationScore, StakeRecord, VerifierRecord};

#[contract]
pub struct VerifierRegistryContract;

#[contractimpl]
impl VerifierRegistryContract {
    pub fn register_verifier(
        env: Env,
        verifier: Address,
        admin: Address,
        name: String,
        initial_stake: i128,
    ) -> Result<u64, Error> {
        verifier.require_auth();
        register_verifier(&env, &verifier, &admin, name, initial_stake)
    }

    pub fn add_stake(env: Env, verifier: Address, amount: i128) -> Result<(), Error> {
        verifier.require_auth();
        add_stake(&env, &verifier, amount)
    }

    pub fn request_stake_withdrawal(
        env: Env,
        verifier: Address,
        amount: i128,
    ) -> Result<(), Error> {
        verifier.require_auth();
        request_stake_withdrawal(&env, &verifier, amount)
    }

    pub fn complete_stake_withdrawal(env: Env, verifier: Address) -> Result<i128, Error> {
        verifier.require_auth();
        complete_stake_withdrawal(&env, &verifier)
    }

    pub fn get_verifier(env: Env, verifier_id: u64) -> Result<VerifierRecord, Error> {
        get_verifier_record(&env, verifier_id)
    }

    pub fn get_verifier_by_address(env: Env, address: Address) -> Result<VerifierRecord, Error> {
        get_verifier_by_address(&env, &address)
    }

    pub fn get_verifier_stake(env: Env, verifier_id: u64) -> StakeRecord {
        get_stake(&env, verifier_id)
    }

    pub fn get_all_verifiers(env: Env) -> Vec<VerifierRecord> {
        get_all_verifiers(&env)
    }

    pub fn get_reputation(env: Env, verifier_id: u64) -> Result<ReputationScore, Error> {
        reputation::get_or_compute_reputation(&env, verifier_id)
    }

    pub fn update_reputation(
        env: Env,
        verifier_id: u64,
        attestation_successful: bool,
    ) -> Result<ReputationScore, Error> {
        reputation::update_reputation(&env, verifier_id, attestation_successful)
    }

    pub fn get_verifier_rankings(env: Env) -> Vec<ReputationScore> {
        reputation::get_verifier_rankings(&env)
    }

    pub fn suspend_verifier(env: Env, verifier_id: u64) -> Result<(), Error> {
        staking::suspend_verifier(&env, verifier_id)
    }

    pub fn slash_verifier(env: Env, verifier_id: u64, amount: i128) -> Result<(), Error> {
        staking::slash_verifier(&env, verifier_id, amount)
    }

    pub fn heartbeat(env: Env, verifier: Address) -> Result<(), Error> {
        verifier.require_auth();
        let id = staking::resolve_verifier_id(&env, &verifier)?;
        update_last_active(&env, id)
    }

    pub fn get_insurance_pool(env: Env) -> InsurancePool {
        insurance::get_pool_details(&env)
    }
}
