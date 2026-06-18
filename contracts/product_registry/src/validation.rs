use soroban_sdk::Env;

use shared::constants::{
    MAX_BATCH_NUMBER_LEN, MAX_IPFS_HASH_LEN, MAX_METADATA_ENTRIES, MAX_ORIGIN_LEN,
    MAX_PRODUCT_DESC_LEN, MAX_PRODUCT_NAME_LEN,
};
use shared::errors::Error;
use shared::types::ProductStatus;

use crate::types::ProductMetadata;

pub fn validate_metadata(env: &Env, metadata: &ProductMetadata) -> Result<(), Error> {
    if metadata.name.is_empty() || metadata.name.len() > MAX_PRODUCT_NAME_LEN {
        return Err(Error::InvalidProductMetadata);
    }
    if metadata.description.len() > MAX_PRODUCT_DESC_LEN {
        return Err(Error::InvalidProductMetadata);
    }
    if metadata.ipfs_hash.is_empty() || metadata.ipfs_hash.len() > MAX_IPFS_HASH_LEN {
        return Err(Error::InvalidProductMetadata);
    }
    if metadata.origin.len() > MAX_ORIGIN_LEN {
        return Err(Error::InvalidProductMetadata);
    }
    if metadata.batch_number.len() > MAX_BATCH_NUMBER_LEN {
        return Err(Error::InvalidProductMetadata);
    }
    if metadata.production_date == 0 {
        return Err(Error::InvalidProductMetadata);
    }
    if metadata.expiry_date != 0 && metadata.expiry_date <= metadata.production_date {
        return Err(Error::InvalidProductMetadata);
    }
    if metadata.material_list.len() > MAX_METADATA_ENTRIES {
        return Err(Error::InvalidProductMetadata);
    }
    if metadata.product_type.is_empty() {
        return Err(Error::InvalidProductMetadata);
    }

    validate_timestamps(env, metadata.production_date, metadata.expiry_date)?;

    Ok(())
}

fn validate_timestamps(_env: &Env, production_date: u64, expiry_date: u64) -> Result<(), Error> {
    if production_date == 0 {
        return Err(Error::InvalidProductMetadata);
    }
    if expiry_date != 0 && expiry_date < production_date {
        return Err(Error::InvalidProductMetadata);
    }
    Ok(())
}

pub fn validate_transfer(
    _env: &Env,
    current_owner: &soroban_sdk::Address,
    caller: &soroban_sdk::Address,
    product_status: &ProductStatus,
) -> Result<(), Error> {
    if caller != current_owner {
        return Err(Error::TransferNotAllowed);
    }
    if *product_status != ProductStatus::Active {
        return Err(Error::ProductNotActive);
    }
    Ok(())
}


