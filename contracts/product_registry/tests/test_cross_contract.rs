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
fn test_register_transfer_query_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let manufacturer = Address::generate(&env);
    let supplier = Address::generate(&env);
    let metadata = create_valid_metadata(&env, &manufacturer);

    let contract_id = env.register_contract(None, ProductRegistryContract);
    let client = ProductRegistryContractClient::new(&env, &contract_id);

    let product_id = client.register_product(&manufacturer, &metadata);
    assert_eq!(client.total_products(), 1);

    client.transfer_product(&manufacturer, &product_id, &supplier);
    let product = client.get_product(&product_id);
    assert_eq!(product.owner, supplier);

    let owner = client.get_owner(&product_id);
    assert_eq!(owner, supplier);

    let manufacturer_products = client.get_products_by_owner(&manufacturer);
    assert_eq!(manufacturer_products.len(), 0);

    let supplier_products = client.get_products_by_owner(&supplier);
    assert_eq!(supplier_products.len(), 1);
}

#[test]
fn test_multi_product_multi_transfer_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let manufacturer = Address::generate(&env);
    let distributor = Address::generate(&env);
    let retailer = Address::generate(&env);
    let metadata = create_valid_metadata(&env, &manufacturer);

    let contract_id = env.register_contract(None, ProductRegistryContract);
    let client = ProductRegistryContractClient::new(&env, &contract_id);

    let id1 = client.register_product(&manufacturer, &metadata);
    let id2 = client.register_product(&manufacturer, &metadata);
    let id3 = client.register_product(&manufacturer, &metadata);

    assert_eq!(client.total_products(), 3);

    client.transfer_product(&manufacturer, &id1, &distributor);
    client.transfer_product(&distributor, &id1, &retailer);
    client.transfer_product(&manufacturer, &id2, &distributor);

    assert_eq!(client.get_owner(&id1), retailer);
    assert_eq!(client.get_owner(&id2), distributor);
    assert_eq!(client.get_owner(&id3), manufacturer);

    assert_eq!(client.get_products_by_owner(&manufacturer).len(), 1);
    assert_eq!(client.get_products_by_owner(&distributor).len(), 1);
    assert_eq!(client.get_products_by_owner(&retailer).len(), 1);
}

#[test]
fn test_register_recall_verify_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let manufacturer = Address::generate(&env);
    let metadata = create_valid_metadata(&env, &manufacturer);

    let contract_id = env.register_contract(None, ProductRegistryContract);
    let client = ProductRegistryContractClient::new(&env, &contract_id);

    let product_id = client.register_product(&manufacturer, &metadata);
    let product = client.get_product(&product_id);
    assert_eq!(product.status, ProductStatus::Active);

    let reason = String::from_str(&env, "Contamination detected");
    client.recall_product(&manufacturer, &product_id, &reason);
    let product = client.get_product(&product_id);
    assert_eq!(product.status, ProductStatus::Recalled);

    let another = Address::generate(&env);
    let result = client.try_transfer_product(&manufacturer, &product_id, &another);
    assert_eq!(result.err().unwrap(), Ok(Error::ProductNotActive));
}
