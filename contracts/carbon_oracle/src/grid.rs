use soroban_sdk::{Env, Map, String, Vec};

pub struct GridStore;

impl GridStore {
    pub fn intensities(env: &Env) -> Map<String, i128> {
        env.storage()
            .instance()
            .get(&"grid_intensities")
            .unwrap_or(Map::new(env))
    }

    pub fn set_intensities(env: &Env, intensities: &Map<String, i128>) {
        env.storage().instance().set(&"grid_intensities", intensities);
    }

    pub fn get(env: &Env, region: &String) -> i128 {
        let intensities = Self::intensities(env);
        intensities.get(region.clone()).unwrap_or(0)
    }

    pub fn set(env: &Env, region: &String, intensity: i128) {
        let mut intensities = Self::intensities(env);
        intensities.set(region.clone(), intensity);
        Self::set_intensities(env, &intensities);
    }

    pub fn batch_set(env: &Env, entries: Vec<(String, i128)>) {
        let mut intensities = Self::intensities(env);
        for entry in entries.iter() {
            let (region, intensity) = entry;
            intensities.set(region, intensity);
        }
        Self::set_intensities(env, &intensities);
    }
}
