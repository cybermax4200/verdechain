#![no_std]

pub mod events;
mod storage;
pub mod types;
pub mod validation;

use soroban_sdk::{contract, contractimpl, Address, Env, String, Vec};

use shared::errors::Error;
use shared::types::ProductStatus;

use crate::events::{product_recalled, product_registered, product_transferred};
use crate::storage::ProductsStore;
use crate::types::{Product, ProductMetadata};
use crate::validation::{validate_metadata, validate_transfer};

#[contract]
pub struct ProductRegistryContract;

#[contractimpl]
impl ProductRegistryContract {
    pub fn register_product(
        env: Env,
        manufacturer: Address,
        metadata: ProductMetadata,
    ) -> Result<u64, Error> {
        manufacturer.require_auth();

        validate_metadata(&env, &metadata)?;

        let product_id = ProductsStore::next_product_id(&env);

        let product = Product {
            id: product_id,
            metadata: metadata.clone(),
            owner: manufacturer.clone(),
            status: ProductStatus::Active,
            created_at: env.ledger().timestamp(),
            updated_at: env.ledger().timestamp(),
        };

        ProductsStore::set_product(&env, product_id, &product);
        ProductsStore::add_to_owner(&env, &manufacturer, product_id);
        ProductsStore::set_next_product_id(&env, product_id + 1);
        ProductsStore::set_total_products(&env, ProductsStore::total_products(&env) + 1);

        product_registered(&env, product_id, &manufacturer, &metadata.ipfs_hash);

        Ok(product_id)
    }

    pub fn transfer_product(
        env: Env,
        caller: Address,
        product_id: u64,
        new_owner: Address,
    ) -> Result<(), Error> {
        caller.require_auth();

        let product = ProductsStore::product(&env, product_id)
            .ok_or(Error::ProductNotFound)?;

        validate_transfer(&env, &product.owner, &caller, &product.status)?;

        let old_owner = product.owner.clone();

        ProductsStore::remove_from_owner(&env, &old_owner, product_id);
        ProductsStore::add_to_owner(&env, &new_owner, product_id);

        let updated = Product {
            owner: new_owner.clone(),
            updated_at: env.ledger().timestamp(),
            ..product
        };
        ProductsStore::set_product(&env, product_id, &updated);

        product_transferred(
            &env,
            product_id,
            &old_owner,
            &new_owner,
            env.ledger().timestamp(),
        );

        Ok(())
    }

    pub fn recall_product(
        env: Env,
        caller: Address,
        product_id: u64,
        reason: String,
    ) -> Result<(), Error> {
        caller.require_auth();

        let product = ProductsStore::product(&env, product_id)
            .ok_or(Error::ProductNotFound)?;

        if caller != product.owner {
            return Err(Error::Unauthorized);
        }

        let updated = Product {
            status: ProductStatus::Recalled,
            updated_at: env.ledger().timestamp(),
            ..product
        };
        ProductsStore::set_product(&env, product_id, &updated);

        product_recalled(&env, product_id, &reason, env.ledger().timestamp());

        Ok(())
    }

    pub fn get_product(env: Env, product_id: u64) -> Result<Product, Error> {
        ProductsStore::product(&env, product_id).ok_or(Error::ProductNotFound)
    }

    pub fn get_owner(env: Env, product_id: u64) -> Result<soroban_sdk::Address, Error> {
        let product = ProductsStore::product(&env, product_id)
            .ok_or(Error::ProductNotFound)?;
        Ok(product.owner)
    }

    pub fn get_products_by_owner(env: Env, owner: Address) -> Vec<Product> {
        let map = ProductsStore::owner_products(&env);
        let ids = map.get(owner).unwrap_or(Vec::new(&env));
        let products = ProductsStore::products(&env);
        let mut result = Vec::new(&env);
        for id in ids.iter() {
            if let Some(product) = products.get(id) {
                result.push_back(product);
            }
        }
        result
    }

    pub fn total_products(env: Env) -> u64 {
        ProductsStore::total_products(&env)
    }
}
