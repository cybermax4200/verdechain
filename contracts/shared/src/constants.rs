use soroban_sdk::Env;

pub const MIN_STAKE: i128 = 10_000_000_000; // 1000 XLM (in stroops)
pub const MAX_PRODUCT_NAME_LEN: u32 = 128;
pub const MAX_PRODUCT_DESC_LEN: u32 = 1024;
pub const MAX_IPFS_HASH_LEN: u32 = 64;
pub const MAX_BATCH_NUMBER_LEN: u32 = 64;
pub const MAX_ORIGIN_LEN: u32 = 128;
pub const MAX_MATERIAL_NAME_LEN: u32 = 64;
pub const MAX_METADATA_ENTRIES: u32 = 32;
pub const MAX_OWNER_PRODUCTS: u32 = 1000;
pub const STAKE_LOCK_PERIOD: u64 = 7 * 24 * 60 * 60; // 7 days in seconds
pub const ATTESTATION_QUORUM: u32 = 3;
pub const ATTESTATION_ESCALATION_QUORUM: u32 = 5;
pub const COOLDOWN_PERIOD: u64 = 2 * 24 * 60 * 60; // 2 days in seconds
pub const REPUTATION_DECAY_INTERVAL: u64 = 30 * 24 * 60 * 60; // 30 days

pub fn max_owner_products(_env: &Env) -> u32 {
    MAX_OWNER_PRODUCTS
}
