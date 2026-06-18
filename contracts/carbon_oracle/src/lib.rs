#![no_std]

pub mod factors;
pub mod grid;
pub mod methods;
pub mod types;

use soroban_sdk::{contract, contractimpl, Address, Env, String, Vec};

use shared::errors::Error;

use crate::factors::FactorStore;
use crate::grid::GridStore;
use crate::methods::MethodologyStore;
use crate::types::EmissionFactor;

#[contract]
pub struct CarbonOracleContract;

#[contractimpl]
impl CarbonOracleContract {
    pub fn update_emission_factor(
        env: Env,
        admin: Address,
        activity_type: String,
        factor: EmissionFactor,
    ) -> Result<(), Error> {
        admin.require_auth();
        validate_factor(&factor)?;
        FactorStore::set(&env, &activity_type, &factor);
        Ok(())
    }

    pub fn get_emission_factor(env: Env, activity_type: String) -> Result<EmissionFactor, Error> {
        FactorStore::get(&env, &activity_type).ok_or(Error::NotFound)
    }

    pub fn get_emission_factor_value(env: Env, activity_type: String) -> i128 {
        FactorStore::get(&env, &activity_type)
            .map(|f| f.factor_value)
            .unwrap_or(0)
    }

    pub fn update_emission_factors_batch(
        env: Env,
        admin: Address,
        entries: Vec<(String, EmissionFactor)>,
    ) -> Result<(), Error> {
        admin.require_auth();
        for entry in entries.iter() {
            let (_key, factor) = entry;
            validate_factor(&factor)?;
        }
        FactorStore::batch_set(&env, entries);
        Ok(())
    }

    pub fn update_grid_intensity(
        env: Env,
        admin: Address,
        region: String,
        intensity: i128,
    ) -> Result<(), Error> {
        admin.require_auth();
        if intensity < 0 {
            return Err(Error::InvalidInput);
        }
        GridStore::set(&env, &region, intensity);
        Ok(())
    }

    pub fn get_grid_intensity(env: Env, region: String) -> i128 {
        GridStore::get(&env, &region)
    }

    pub fn update_grid_intensities_batch(
        env: Env,
        admin: Address,
        entries: Vec<(String, i128)>,
    ) -> Result<(), Error> {
        admin.require_auth();
        for entry in entries.iter() {
            let (_region, intensity) = entry;
            if intensity < 0 {
                return Err(Error::InvalidInput);
            }
        }
        GridStore::batch_set(&env, entries);
        Ok(())
    }

    pub fn set_methodology(
        env: Env,
        admin: Address,
        methodology: String,
    ) -> Result<(), Error> {
        admin.require_auth();
        if methodology.is_empty() {
            return Err(Error::InvalidInput);
        }
        MethodologyStore::set(&env, &methodology);
        Ok(())
    }

    pub fn get_methodology_version(env: Env) -> String {
        MethodologyStore::get(&env)
    }
}

fn validate_factor(factor: &EmissionFactor) -> Result<(), Error> {
    if factor.activity_type.is_empty() || factor.unit.is_empty() || factor.source.is_empty() {
        return Err(Error::InvalidInput);
    }
    if factor.factor_value < 0 {
        return Err(Error::InvalidInput);
    }
    Ok(())
}
