use soroban_sdk::{Env, String};

pub struct MethodologyStore;

impl MethodologyStore {
    pub fn get(env: &Env) -> String {
        env.storage()
            .instance()
            .get(&"methodology")
            .unwrap_or(String::from_str(env, "GHG Protocol 2024"))
    }

    pub fn set(env: &Env, methodology: &String) {
        env.storage().instance().set(&"methodology", methodology);
    }
}
