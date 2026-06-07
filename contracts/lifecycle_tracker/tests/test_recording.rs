use soroban_sdk::{Env, String, Address};
use soroban_sdk::testutils::Address as _;

use lifecycle_tracker::{LifecycleTrackerContract, LifecycleTrackerContractClient};
use lifecycle_tracker::types::LifecycleEventData;
use shared::errors::Error;
use shared::types::LifecycleStage;

fn create_event_data(
    env: &Env,
    actor: &Address,
    stage: LifecycleStage,
) -> LifecycleEventData {
    LifecycleEventData {
        stage,
        actor: actor.clone(),
        location: String::from_str(env, "Mumbai, India"),
        description: String::from_str(env, "Raw cotton harvesting completed"),
        energy_used: 5000,
        fuel_used: 200,
        waste_generated: 50,
        metadata_ipfs: String::from_str(env, "QmTest123"),
    }
}

fn setup_contract(env: &Env) -> LifecycleTrackerContractClient<'_> {
    let contract_id = env.register_contract(None, LifecycleTrackerContract);
    LifecycleTrackerContractClient::new(env, &contract_id)
}

#[test]
fn test_record_event_success() {
    let env = Env::default();
    env.mock_all_auths();

    let actor = Address::generate(&env);
    let client = setup_contract(&env);
    let data = create_event_data(&env, &actor, LifecycleStage::RawMaterialExtraction);

    let event_id = client.record_event(&actor, &1u64, &data);
    assert_eq!(event_id, 1);

    let count = client.get_event_count(&1u64);
    assert_eq!(count, 1);
}

#[test]
fn test_record_event_increments_id() {
    let env = Env::default();
    env.mock_all_auths();

    let actor = Address::generate(&env);
    let client = setup_contract(&env);

    let data1 = create_event_data(&env, &actor, LifecycleStage::RawMaterialExtraction);
    let data2 = create_event_data(&env, &actor, LifecycleStage::Transportation);

    let id1 = client.record_event(&actor, &1u64, &data1);
    let id2 = client.record_event(&actor, &1u64, &data2);

    assert_eq!(id1, 1);
    assert_eq!(id2, 2);
    assert_eq!(client.get_event_count(&1u64), 2);
}

#[test]
fn test_record_event_different_products() {
    let env = Env::default();
    env.mock_all_auths();

    let actor = Address::generate(&env);
    let client = setup_contract(&env);

    let data = create_event_data(&env, &actor, LifecycleStage::RawMaterialExtraction);

    let id1 = client.record_event(&actor, &1u64, &data);
    let id2 = client.record_event(&actor, &2u64, &data);

    assert_eq!(id1, 1);
    assert_eq!(id2, 2);
    assert_eq!(client.get_event_count(&1u64), 1);
    assert_eq!(client.get_event_count(&2u64), 1);
}

#[test]
fn test_record_event_empty_location_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let actor = Address::generate(&env);
    let client = setup_contract(&env);

    let mut data = create_event_data(&env, &actor, LifecycleStage::RawMaterialExtraction);
    data.location = String::from_str(&env, "");

    let result = client.try_record_event(&actor, &1u64, &data);
    assert_eq!(result.err().unwrap(), Ok(Error::InvalidEventData));
}

#[test]
fn test_record_event_empty_description_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let actor = Address::generate(&env);
    let client = setup_contract(&env);

    let mut data = create_event_data(&env, &actor, LifecycleStage::RawMaterialExtraction);
    data.description = String::from_str(&env, "");

    let result = client.try_record_event(&actor, &1u64, &data);
    assert_eq!(result.err().unwrap(), Ok(Error::InvalidEventData));
}

#[test]
fn test_record_event_negative_energy_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let actor = Address::generate(&env);
    let client = setup_contract(&env);

    let mut data = create_event_data(&env, &actor, LifecycleStage::RawMaterialExtraction);
    data.energy_used = -100;

    let result = client.try_record_event(&actor, &1u64, &data);
    assert_eq!(result.err().unwrap(), Ok(Error::InvalidEventData));
}

#[test]
fn test_record_event_wrong_stage_order_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let actor = Address::generate(&env);
    let client = setup_contract(&env);

    let data1 = create_event_data(&env, &actor, LifecycleStage::RawMaterialExtraction);
    let data2 = create_event_data(&env, &actor, LifecycleStage::Manufacturing);

    client.record_event(&actor, &1u64, &data1);

    let result = client.try_record_event(&actor, &1u64, &data2);
    assert_eq!(result.err().unwrap(), Ok(Error::StageMismatch));
}

#[test]
fn test_record_event_stage_at_same_level_allowed() {
    let env = Env::default();
    env.mock_all_auths();

    let actor = Address::generate(&env);
    let client = setup_contract(&env);

    let data1 = create_event_data(&env, &actor, LifecycleStage::RawMaterialExtraction);
    let data2 = create_event_data(&env, &actor, LifecycleStage::RawMaterialExtraction);

    client.record_event(&actor, &1u64, &data1);
    let id2 = client.record_event(&actor, &1u64, &data2);

    assert_eq!(id2, 2);
    assert_eq!(client.get_event_count(&1u64), 2);
}

#[test]
fn test_get_lifecycle_summary() {
    let env = Env::default();
    env.mock_all_auths();

    let actor = Address::generate(&env);
    let client = setup_contract(&env);

    let data = create_event_data(&env, &actor, LifecycleStage::RawMaterialExtraction);
    client.record_event(&actor, &1u64, &data);

    let summary = client.get_lifecycle(&1u64);
    assert_eq!(summary.product_id, 1);
    assert_eq!(summary.total_events, 1);
    assert!(summary.total_emissions > 0);
}

#[test]
fn test_get_event_returns_recorded_event() {
    let env = Env::default();
    env.mock_all_auths();

    let actor = Address::generate(&env);
    let client = setup_contract(&env);

    let data = create_event_data(&env, &actor, LifecycleStage::RawMaterialExtraction);
    let event_id = client.record_event(&actor, &1u64, &data);

    let event = client.get_event(&1u64, &event_id);
    assert_eq!(event.id, event_id);
    assert_eq!(event.product_id, 1);
    assert_eq!(event.stage, LifecycleStage::RawMaterialExtraction);
    assert_eq!(event.actor, actor);
    assert_eq!(event.location, String::from_str(&env, "Mumbai, India"));
}

#[test]
fn test_get_nonexistent_event_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let _actor = Address::generate(&env);
    let client = setup_contract(&env);

    let result = client.try_get_event(&1u64, &999u64);
    assert_eq!(result.err().unwrap(), Ok(Error::EventNotFound));
}
