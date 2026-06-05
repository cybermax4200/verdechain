use soroban_sdk::{vec, Env, String, Address, Vec};
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
fn test_register_product_success() {
    let env = Env::default();
    env.mock_all_auths();

    let manufacturer = Address::generate(&env);
    let metadata = create_valid_metadata(&env, &manufacturer);

    let contract_id = env.register_contract(None, ProductRegistryContract);
    let client = ProductRegistryContractClient::new(&env, &contract_id);

    let product_id = client.register_product(&manufacturer, &metadata);

    assert_eq!(product_id, 1);
    assert_eq!(client.total_products(), 1);

    let product = client.get_product(&product_id);
    assert_eq!(product.id, 1);
    assert_eq!(product.metadata.name, String::from_str(&env, "Organic Cotton T-Shirt"));
    assert_eq!(product.owner, manufacturer);
}

#[test]
fn test_register_product_increments_id() {
    let env = Env::default();
    env.mock_all_auths();

    let manufacturer = Address::generate(&env);
    let metadata = create_valid_metadata(&env, &manufacturer);

    let contract_id = env.register_contract(None, ProductRegistryContract);
    let client = ProductRegistryContractClient::new(&env, &contract_id);

    let id1 = client.register_product(&manufacturer, &metadata);
    let id2 = client.register_product(&manufacturer, &metadata);

    assert_eq!(id1, 1);
    assert_eq!(id2, 2);
    assert_eq!(client.total_products(), 2);
}

#[test]
fn test_register_product_empty_name_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let manufacturer = Address::generate(&env);
    let mut metadata = create_valid_metadata(&env, &manufacturer);
    metadata.name = String::from_str(&env, "");

    let contract_id = env.register_contract(None, ProductRegistryContract);
    let client = ProductRegistryContractClient::new(&env, &contract_id);

    let result = client.try_register_product(&manufacturer, &metadata);
    assert_eq!(result.err().unwrap(), Ok(Error::InvalidProductMetadata));
}

#[test]
fn test_register_product_empty_ipfs_hash_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let manufacturer = Address::generate(&env);
    let mut metadata = create_valid_metadata(&env, &manufacturer);
    metadata.ipfs_hash = String::from_str(&env, "");

    let contract_id = env.register_contract(None, ProductRegistryContract);
    let client = ProductRegistryContractClient::new(&env, &contract_id);

    let result = client.try_register_product(&manufacturer, &metadata);
    assert_eq!(result.err().unwrap(), Ok(Error::InvalidProductMetadata));
}

#[test]
fn test_register_product_zero_production_date_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let manufacturer = Address::generate(&env);
    let mut metadata = create_valid_metadata(&env, &manufacturer);
    metadata.production_date = 0;

    let contract_id = env.register_contract(None, ProductRegistryContract);
    let client = ProductRegistryContractClient::new(&env, &contract_id);

    let result = client.try_register_product(&manufacturer, &metadata);
    assert_eq!(result.err().unwrap(), Ok(Error::InvalidProductMetadata));
}

#[test]
fn test_register_product_empty_product_type_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let manufacturer = Address::generate(&env);
    let mut metadata = create_valid_metadata(&env, &manufacturer);
    metadata.product_type = String::from_str(&env, "");

    let contract_id = env.register_contract(None, ProductRegistryContract);
    let client = ProductRegistryContractClient::new(&env, &contract_id);

    let result = client.try_register_product(&manufacturer, &metadata);
    assert_eq!(result.err().unwrap(), Ok(Error::InvalidProductMetadata));
}

#[test]
fn test_register_product_expiry_before_production_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let manufacturer = Address::generate(&env);
    let mut metadata = create_valid_metadata(&env, &manufacturer);
    metadata.expiry_date = 1600000000;

    let contract_id = env.register_contract(None, ProductRegistryContract);
    let client = ProductRegistryContractClient::new(&env, &contract_id);

    let result = client.try_register_product(&manufacturer, &metadata);
    assert_eq!(result.err().unwrap(), Ok(Error::InvalidProductMetadata));
}

#[test]
fn test_get_products_by_owner() {
    let env = Env::default();
    env.mock_all_auths();

    let manufacturer = Address::generate(&env);
    let metadata = create_valid_metadata(&env, &manufacturer);

    let contract_id = env.register_contract(None, ProductRegistryContract);
    let client = ProductRegistryContractClient::new(&env, &contract_id);

    let id1 = client.register_product(&manufacturer, &metadata);
    let id2 = client.register_product(&manufacturer, &metadata);

    let products = client.get_products_by_owner(&manufacturer);
    assert_eq!(products.len(), 2);

    let mut ids = Vec::new(&env);
    for p in products.iter() {
        ids.push_back(p.id);
    }
    assert_eq!(ids.get(0).unwrap(), id1);
    assert_eq!(ids.get(1).unwrap(), id2);
}
