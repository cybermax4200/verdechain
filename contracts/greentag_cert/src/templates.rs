use soroban_sdk::{contracttype, Env, String, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TemplateRecord {
    pub name: String,
    pub schema_ipfs_hash: String,
    pub version: String,
}

pub struct TemplateStore;

impl TemplateStore {
    pub fn get(_env: &Env, _cert_type: &String) -> Option<TemplateRecord> {
        None
    }

    pub fn set(_env: &Env, _name: &String, _template: &TemplateRecord) {}

    pub fn list(_env: &Env) -> Vec<TemplateRecord> {
        Vec::new(_env)
    }
}
