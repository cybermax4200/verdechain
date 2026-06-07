use soroban_sdk::{vec, Env, String, Address};
use soroban_sdk::testutils::Address as _;

use lifecycle_tracker::{LifecycleTrackerContract, LifecycleTrackerContractClient};
use lifecycle_tracker::types::LifecycleEventData;
use product_registry::{ProductRegistryContract, ProductRegistryContractClient};
use product_registry::types::ProductMetadata;
use shared::types::{LifecycleStage, ProductStatus};

fn create_product_metadata(env: &Env, manufacturer: &Address) -> ProductMetadata {
    ProductMetadata {
        name: String::from_str(env, "Test Product"),
        description: String::from_str(env, "A test product for lifecycle tracking"),
        manufacturer: manufacturer.clone(),
        origin: String::from_str(env, "Test Origin"),
        batch_number: String::from_str(env, "BATCH-TEST-001"),
        ipfs_hash: String::from_str(env, "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"),
        product_type: String::from_str(env, "Test"),
        material_list: vec![env, String::from_str(env, "Test Material")],
        production_date: 1700000000,
        expiry_date: 1730000000,
    }
}

fn create_event_data(
    env: &Env,
    actor: &Address,
    stage: LifecycleStage,
) -> LifecycleEventData {
    LifecycleEventData {
        stage,
        actor: actor.clone(),
        location: String::from_str(env, "Test Facility"),
        description: String::from_str(env, "Lifecycle event description"),
        energy_used: 1000,
        fuel_used: 50,
        waste_generated: 10,
        metadata_ipfs: String::from_str(env, "QmTestFlow"),
    }
}

#[test]
fn test_register_product_and_record_lifecycle() {
    let env = Env::default();
    env.mock_all_auths();

    let manufacturer = Address::generate(&env);
    let metadata = create_product_metadata(&env, &manufacturer);

    let registry_id = env.register_contract(None, ProductRegistryContract);
    let registry_client = ProductRegistryContractClient::new(&env, &registry_id);

    let lifecycle_id = env.register_contract(None, LifecycleTrackerContract);
    let lifecycle_client = LifecycleTrackerContractClient::new(&env, &lifecycle_id);

    let product_id = registry_client.register_product(&manufacturer, &metadata);
    assert_eq!(product_id, 1);
    assert_eq!(registry_client.total_products(), 1);

    let product = registry_client.get_product(&product_id);
    assert_eq!(product.status, ProductStatus::Active);

    let event_data = create_event_data(&env, &manufacturer, LifecycleStage::RawMaterialExtraction);
    let event_id = lifecycle_client.record_event(&manufacturer, &product_id, &event_data);
    assert_eq!(event_id, 1);

    let summary = lifecycle_client.get_lifecycle(&product_id);
    assert_eq!(summary.product_id, product_id);
    assert_eq!(summary.total_events, 1);
    assert!(summary.total_emissions > 0);

    assert_eq!(lifecycle_client.get_event_count(&product_id), 1);
}

#[test]
fn test_product_transfer_then_lifecycle_event() {
    let env = Env::default();
    env.mock_all_auths();

    let manufacturer = Address::generate(&env);
    let supplier = Address::generate(&env);
    let metadata = create_product_metadata(&env, &manufacturer);

    let registry_id = env.register_contract(None, ProductRegistryContract);
    let registry_client = ProductRegistryContractClient::new(&env, &registry_id);

    let lifecycle_id = env.register_contract(None, LifecycleTrackerContract);
    let lifecycle_client = LifecycleTrackerContractClient::new(&env, &lifecycle_id);

    let product_id = registry_client.register_product(&manufacturer, &metadata);

    registry_client.transfer_product(&manufacturer, &product_id, &supplier);
    let product = registry_client.get_product(&product_id);
    assert_eq!(product.owner, supplier);

    let event_data = create_event_data(
        &env,
        &supplier,
        LifecycleStage::RawMaterialExtraction,
    );
    let event_id = lifecycle_client.record_event(&supplier, &product_id, &event_data);
    assert_eq!(event_id, 1);

    let summary = lifecycle_client.get_lifecycle(&product_id);
    assert_eq!(summary.total_events, 1);
}

#[test]
fn test_product_recall_stops_lifecycle_events() {
    let env = Env::default();
    env.mock_all_auths();

    let manufacturer = Address::generate(&env);
    let metadata = create_product_metadata(&env, &manufacturer);

    let registry_id = env.register_contract(None, ProductRegistryContract);
    let registry_client = ProductRegistryContractClient::new(&env, &registry_id);

    let lifecycle_id = env.register_contract(None, LifecycleTrackerContract);
    let lifecycle_client = LifecycleTrackerContractClient::new(&env, &lifecycle_id);

    let product_id = registry_client.register_product(&manufacturer, &metadata);

    let event_data = create_event_data(
        &env,
        &manufacturer,
        LifecycleStage::RawMaterialExtraction,
    );
    let event_id = lifecycle_client.record_event(&manufacturer, &product_id, &event_data);
    assert_eq!(event_id, 1);

    let reason = String::from_str(&env, "Quality issue");
    registry_client.recall_product(&manufacturer, &product_id, &reason);
    let product = registry_client.get_product(&product_id);
    assert_eq!(product.status, ProductStatus::Recalled);

    let summary = lifecycle_client.get_lifecycle(&product_id);
    assert_eq!(summary.total_events, 1);
}

#[test]
fn test_full_multi_stage_lifecycle_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let manufacturer = Address::generate(&env);
    let metadata = create_product_metadata(&env, &manufacturer);

    let registry_id = env.register_contract(None, ProductRegistryContract);
    let registry_client = ProductRegistryContractClient::new(&env, &registry_id);

    let lifecycle_id = env.register_contract(None, LifecycleTrackerContract);
    let lifecycle_client = LifecycleTrackerContractClient::new(&env, &lifecycle_id);

    let product_id = registry_client.register_product(&manufacturer, &metadata);

    let extraction = create_event_data(
        &env,
        &manufacturer,
        LifecycleStage::RawMaterialExtraction,
    );
    let transportation = create_event_data(
        &env,
        &manufacturer,
        LifecycleStage::Transportation,
    );
    let manufacturing = create_event_data(
        &env,
        &manufacturer,
        LifecycleStage::Manufacturing,
    );

    lifecycle_client.record_event(&manufacturer, &product_id, &extraction);
    lifecycle_client.record_event(&manufacturer, &product_id, &transportation);
    lifecycle_client.record_event(&manufacturer, &product_id, &manufacturing);

    let summary = lifecycle_client.get_lifecycle(&product_id);
    assert_eq!(summary.total_events, 3);
    assert_eq!(summary.stages_completed.len(), 3);
    assert!(summary.total_emissions > 0);

    let emissions = lifecycle_client.get_emissions_summary(&product_id);
    assert_eq!(emissions.total_emissions, summary.total_emissions);
    assert!(emissions.energy_emissions > 0);
    assert!(emissions.fuel_emissions > 0);

    assert_eq!(lifecycle_client.get_event_count(&product_id), 3);
}
