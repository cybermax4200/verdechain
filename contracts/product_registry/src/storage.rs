use soroban_sdk::{Address, Env, Map, Vec};

use crate::types::Product;

pub struct ProductsStore;

impl ProductsStore {
    pub fn products(env: &Env) -> Map<u64, Product> {
        env.storage().instance().get(&"products").unwrap_or(Map::new(env))
    }

    pub fn set_products(env: &Env, products: &Map<u64, Product>) {
        env.storage().instance().set(&"products", products);
    }

    pub fn product(env: &Env, id: u64) -> Option<Product> {
        let products = Self::products(env);
        products.get(id)
    }

    pub fn set_product(env: &Env, id: u64, product: &Product) {
        let mut products = Self::products(env);
        products.set(id, product.clone());
        Self::set_products(env, &products);
    }

    pub fn owner_products(env: &Env) -> Map<Address, Vec<u64>> {
        env.storage().instance().get(&"owner_products").unwrap_or(Map::new(env))
    }

    pub fn set_owner_products(env: &Env, map: &Map<Address, Vec<u64>>) {
        env.storage().instance().set(&"owner_products", map);
    }

    pub fn add_to_owner(env: &Env, owner: &Address, product_id: u64) {
        let mut map = Self::owner_products(env);
        let mut ids = map.get(owner.clone()).unwrap_or(Vec::new(env));
        ids.push_back(product_id);
        map.set(owner.clone(), ids);
        Self::set_owner_products(env, &map);
    }

    pub fn remove_from_owner(env: &Env, owner: &Address, product_id: u64) {
        let mut map = Self::owner_products(env);
        if let Some(ids) = map.get(owner.clone()) {
            let mut filtered = Vec::new(env);
            for id in ids.iter() {
                if id != product_id {
                    filtered.push_back(id);
                }
            }
            map.set(owner.clone(), filtered);
        }
        Self::set_owner_products(env, &map);
    }

    pub fn next_product_id(env: &Env) -> u64 {
        env.storage().instance().get(&"next_id").unwrap_or(1u64)
    }

    pub fn set_next_product_id(env: &Env, id: u64) {
        env.storage().instance().set(&"next_id", &id);
    }

    pub fn total_products(env: &Env) -> u64 {
        env.storage().instance().get(&"total").unwrap_or(0u64)
    }

    pub fn set_total_products(env: &Env, total: u64) {
        env.storage().instance().set(&"total", &total);
    }
}
