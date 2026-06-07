use soroban_sdk::{vec, Env, String, Address};
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
        location: String::from_str(env, "Test Location"),
        description: String::from_str(env, "Test event description"),
        energy_used: 1000,
        fuel_used: 50,
        waste_generated: 10,
        metadata_ipfs: String::from_str(env, "QmTestBatch"),
    }
}

fn setup_contract(env: &Env) -> LifecycleTrackerContractClient<'_> {
    let contract_id = env.register_contract(None, LifecycleTrackerContract);
    LifecycleTrackerContractClient::new(env, &contract_id)
}

#[test]
fn test_batch_record_events_success() {
    let env = Env::default();
    env.mock_all_auths();

    let actor = Address::generate(&env);
    let client = setup_contract(&env);

    let data1 = create_event_data(&env, &actor, LifecycleStage::RawMaterialExtraction);
    let data2 = create_event_data(&env, &actor, LifecycleStage::Transportation);

    let batch = vec![&env, data1, data2];

    let count = client.batch_record_events(&actor, &1u64, &batch);
    assert_eq!(count, 2);
    assert_eq!(client.get_event_count(&1u64), 2);
}

#[test]
fn test_batch_record_events_stage_order_valid() {
    let env = Env::default();
    env.mock_all_auths();

    let actor = Address::generate(&env);
    let client = setup_contract(&env);

    let data1 = create_event_data(&env, &actor, LifecycleStage::RawMaterialExtraction);
    let data2 = create_event_data(&env, &actor, LifecycleStage::Transportation);
    let data3 = create_event_data(&env, &actor, LifecycleStage::Manufacturing);

    let batch = vec![&env, data1, data2, data3];

    let count = client.batch_record_events(&actor, &1u64, &batch);
    assert_eq!(count, 3);
}

#[test]
fn test_batch_record_events_with_invalid_data_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let actor = Address::generate(&env);
    let client = setup_contract(&env);

    let mut data = create_event_data(&env, &actor, LifecycleStage::RawMaterialExtraction);
    data.location = String::from_str(&env, "");

    let batch = vec![&env, data];

    let result = client.try_batch_record_events(&actor, &1u64, &batch);
    assert_eq!(result.err().unwrap(), Ok(Error::InvalidEventData));
}

#[test]
fn test_batch_record_events_invalid_stage_order_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let actor = Address::generate(&env);
    let client = setup_contract(&env);

    let data1 = create_event_data(&env, &actor, LifecycleStage::RawMaterialExtraction);
    let data2 = create_event_data(&env, &actor, LifecycleStage::Manufacturing);

    client.record_event(&actor, &1u64, &data1);

    let batch = vec![&env, data2];

    let result = client.try_batch_record_events(&actor, &1u64, &batch);
    assert_eq!(result.err().unwrap(), Ok(Error::StageMismatch));
}

#[test]
fn test_batch_record_multiple_products() {
    let env = Env::default();
    env.mock_all_auths();

    let actor = Address::generate(&env);
    let client = setup_contract(&env);

    let data1 = create_event_data(&env, &actor, LifecycleStage::RawMaterialExtraction);

    let batch1 = vec![&env, data1.clone()];
    let batch2 = vec![&env, data1];

    let c1 = client.batch_record_events(&actor, &1u64, &batch1);
    let c2 = client.batch_record_events(&actor, &2u64, &batch2);

    assert_eq!(c1, 1);
    assert_eq!(c2, 1);
    assert_eq!(client.get_event_count(&1u64), 1);
    assert_eq!(client.get_event_count(&2u64), 1);
}
