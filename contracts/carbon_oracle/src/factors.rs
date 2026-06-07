use soroban_sdk::{Env, Map, String, Vec};

use crate::types::EmissionFactor;

pub struct FactorStore;

impl FactorStore {
    pub fn factors(env: &Env) -> Map<String, EmissionFactor> {
        env.storage()
            .instance()
            .get(&"factors")
            .unwrap_or(Map::new(env))
    }

    pub fn set_factors(env: &Env, factors: &Map<String, EmissionFactor>) {
        env.storage().instance().set(&"factors", factors);
    }

    pub fn get(env: &Env, activity_type: &String) -> Option<EmissionFactor> {
        let factors = Self::factors(env);
        factors.get(activity_type.clone())
    }

    pub fn set(env: &Env, activity_type: &String, factor: &EmissionFactor) {
        let mut factors = Self::factors(env);
        factors.set(activity_type.clone(), factor.clone());
        Self::set_factors(env, &factors);
    }

    pub fn batch_set(env: &Env, entries: Vec<(String, EmissionFactor)>) {
        let mut factors = Self::factors(env);
        for entry in entries.iter() {
            let (key, factor) = entry;
            factors.set(key, factor);
        }
        Self::set_factors(env, &factors);
    }
}
