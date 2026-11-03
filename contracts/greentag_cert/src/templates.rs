use soroban_sdk::{contracttype, Env, Map, String, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TemplateRecord {
    pub name: String,
    pub schema_ipfs_hash: String,
    pub version: String,
}

pub struct TemplateStore;

impl TemplateStore {
    pub fn get(env: &Env, name: &String) -> Option<TemplateRecord> {
        let templates: Map<String, TemplateRecord> = env
            .storage()
            .instance()
            .get(&"templates")
            .unwrap_or(Map::new(env));
        templates.get(name.clone())
    }

    pub fn set(env: &Env, name: &String, template: &TemplateRecord) {
        let mut templates: Map<String, TemplateRecord> = env
            .storage()
            .instance()
            .get(&"templates")
            .unwrap_or(Map::new(env));
        templates.set(name.clone(), template.clone());
        env.storage().instance().set(&"templates", &templates);
    }

    pub fn list(env: &Env) -> Vec<TemplateRecord> {
        let templates: Map<String, TemplateRecord> = env
            .storage()
            .instance()
            .get(&"templates")
            .unwrap_or(Map::new(env));
        let mut result = Vec::new(env);
        for (_, t) in templates.iter() {
            result.push_back(t);
        }
        result
    }
}
