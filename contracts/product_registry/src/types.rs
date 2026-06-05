use soroban_sdk::{contracttype, Address, String, Vec};

use shared::types::ProductStatus;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProductMetadata {
    pub name: String,
    pub description: String,
    pub manufacturer: Address,
    pub origin: String,
    pub batch_number: String,
    pub ipfs_hash: String,
    pub product_type: String,
    pub material_list: Vec<String>,
    pub production_date: u64,
    pub expiry_date: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Product {
    pub id: u64,
    pub metadata: ProductMetadata,
    pub owner: Address,
    pub status: ProductStatus,
    pub created_at: u64,
    pub updated_at: u64,
}
