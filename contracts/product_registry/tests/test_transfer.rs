use soroban_sdk::{vec, Env, String, Address};
use soroban_sdk::testutils::Address as _;

use product_registry::{ProductRegistryContract, ProductRegistryContractClient};
use product_registry::types::ProductMetadata;
use shared::errors::Error;

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
fn test_transfer_product_success() {
    let env = Env::default();
    env.mock_all_auths();

    let manufacturer = Address::generate(&env);
    let new_owner = Address::generate(&env);
    let metadata = create_valid_metadata(&env, &manufacturer);

    let contract_id = env.register_contract(None, ProductRegistryContract);
    let client = ProductRegistryContractClient::new(&env, &contract_id);

    let product_id = client.register_product(&manufacturer, &metadata);
    client.transfer_product(&manufacturer, &product_id, &new_owner);

    let product = client.get_product(&product_id);
    assert_eq!(product.owner, new_owner);
}

#[test]
fn test_transfer_product_updates_owner_list() {
    let env = Env::default();
    env.mock_all_auths();

    let manufacturer = Address::generate(&env);
    let new_owner = Address::generate(&env);
    let metadata = create_valid_metadata(&env, &manufacturer);

    let contract_id = env.register_contract(None, ProductRegistryContract);
    let client = ProductRegistryContractClient::new(&env, &contract_id);

    let product_id = client.register_product(&manufacturer, &metadata);
    client.transfer_product(&manufacturer, &product_id, &new_owner);

    let old_owner_products = client.get_products_by_owner(&manufacturer);
    assert_eq!(old_owner_products.len(), 0);

    let new_owner_products = client.get_products_by_owner(&new_owner);
    assert_eq!(new_owner_products.len(), 1);
}

#[test]
fn test_transfer_product_non_owner_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let manufacturer = Address::generate(&env);
    let non_owner = Address::generate(&env);
    let new_owner = Address::generate(&env);
    let metadata = create_valid_metadata(&env, &manufacturer);

    let contract_id = env.register_contract(None, ProductRegistryContract);
    let client = ProductRegistryContractClient::new(&env, &contract_id);

    let product_id = client.register_product(&manufacturer, &metadata);
    let result = client.try_transfer_product(&non_owner, &product_id, &new_owner);
    assert_eq!(result.err().unwrap(), Ok(Error::TransferNotAllowed));
}

#[test]
fn test_transfer_product_not_found_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let manufacturer = Address::generate(&env);
    let new_owner = Address::generate(&env);

    let contract_id = env.register_contract(None, ProductRegistryContract);
    let client = ProductRegistryContractClient::new(&env, &contract_id);

    let result = client.try_transfer_product(&manufacturer, &999u64, &new_owner);
    assert_eq!(result.err().unwrap(), Ok(Error::ProductNotFound));
}

#[test]
fn test_transfer_product_to_self_succeeds() {
    let env = Env::default();
    env.mock_all_auths();

    let manufacturer = Address::generate(&env);
    let metadata = create_valid_metadata(&env, &manufacturer);

    let contract_id = env.register_contract(None, ProductRegistryContract);
    let client = ProductRegistryContractClient::new(&env, &contract_id);

    let product_id = client.register_product(&manufacturer, &metadata);
    client.transfer_product(&manufacturer, &product_id, &manufacturer);

    let product = client.get_product(&product_id);
    assert_eq!(product.owner, manufacturer);
}
