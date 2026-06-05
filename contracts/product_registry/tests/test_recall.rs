use soroban_sdk::{vec, Env, String, Address};
use soroban_sdk::testutils::Address as _;

use product_registry::{ProductRegistryContract, ProductRegistryContractClient};
use product_registry::types::ProductMetadata;
use shared::errors::Error;
use shared::types::ProductStatus;

fn create_valid_metadata(env: &Env, manufacturer: &Address) -> ProductMetadata {
    ProductMetadata {
        name: String::from_str(env, "Organic Cotton T-Shirt"),
        description: String::from_str(env, "A sustainable organic cotton t-shirt"),
        manufacturer: manufacturer.clone(),
        origin: String::from_str(env, "India"),
        batch_number: String::from_str(env, "BATCH-2024-001"),
        ipfs_hash: String::from_str(env, "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"),
        product_type: String::from_str(env, "Apparel"),
        material_list: vec![env, String::from_str(env, "Organic Cotton")],
        production_date: 1700000000,
        expiry_date: 1730000000,
    }
}

#[test]
fn test_recall_product_success() {
    let env = Env::default();
    env.mock_all_auths();

    let manufacturer = Address::generate(&env);
    let metadata = create_valid_metadata(&env, &manufacturer);

    let contract_id = env.register_contract(None, ProductRegistryContract);
    let client = ProductRegistryContractClient::new(&env, &contract_id);

    let product_id = client.register_product(&manufacturer, &metadata);
    let reason = String::from_str(&env, "Quality control failure");

    client.recall_product(&manufacturer, &product_id, &reason);

    let product = client.get_product(&product_id);
    assert_eq!(product.status, ProductStatus::Recalled);
}

#[test]
fn test_recall_product_non_owner_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let manufacturer = Address::generate(&env);
    let non_owner = Address::generate(&env);
    let metadata = create_valid_metadata(&env, &manufacturer);

    let contract_id = env.register_contract(None, ProductRegistryContract);
    let client = ProductRegistryContractClient::new(&env, &contract_id);

    let product_id = client.register_product(&manufacturer, &metadata);
    let reason = String::from_str(&env, "Test recall");

    let result = client.try_recall_product(&non_owner, &product_id, &reason);
    assert_eq!(result.err().unwrap(), Ok(Error::Unauthorized));
}

#[test]
fn test_recall_nonexistent_product_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let manufacturer = Address::generate(&env);
    let reason = String::from_str(&env, "Test recall");

    let contract_id = env.register_contract(None, ProductRegistryContract);
    let client = ProductRegistryContractClient::new(&env, &contract_id);

    let result = client.try_recall_product(&manufacturer, &999u64, &reason);
    assert_eq!(result.err().unwrap(), Ok(Error::ProductNotFound));
}

#[test]
fn test_recall_transfer_recalled_product_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let manufacturer = Address::generate(&env);
    let new_owner = Address::generate(&env);
    let metadata = create_valid_metadata(&env, &manufacturer);

    let contract_id = env.register_contract(None, ProductRegistryContract);
    let client = ProductRegistryContractClient::new(&env, &contract_id);

    let product_id = client.register_product(&manufacturer, &metadata);
    let reason = String::from_str(&env, "Defective batch");
    client.recall_product(&manufacturer, &product_id, &reason);

    let result = client.try_transfer_product(&manufacturer, &product_id, &new_owner);
    assert_eq!(result.err().unwrap(), Ok(Error::ProductNotActive));
}
