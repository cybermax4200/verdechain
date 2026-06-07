use soroban_sdk::{Env, String, Address};
use soroban_sdk::testutils::Address as _;

use carbon_oracle::{CarbonOracleContract, CarbonOracleContractClient};
use carbon_oracle::types::EmissionFactor;
use lifecycle_tracker::{LifecycleTrackerContract, LifecycleTrackerContractClient};
use lifecycle_tracker::types::LifecycleEventData;
use shared::types::LifecycleStage;

fn factor(env: &Env, activity: &str, value: i128) -> EmissionFactor {
    EmissionFactor {
        activity_type: String::from_str(env, activity),
        factor_value: value,
        unit: String::from_str(env, "gCO2e/unit"),
        source: String::from_str(env, "GHG Protocol 2024"),
        region: String::from_str(env, "global"),
    }
}

fn event_data(env: &Env, actor: &Address, stage: LifecycleStage) -> LifecycleEventData {
    LifecycleEventData {
        stage,
        actor: actor.clone(),
        location: String::from_str(env, "Test Facility"),
        description: String::from_str(env, "Test lifecycle event"),
        energy_used: 1000,
        fuel_used: 50,
        waste_generated: 10,
        metadata_ipfs: String::from_str(env, "QmTestIntegration"),
    }
}

#[test]
fn test_oracle_factors_affect_lifecycle_emissions() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);

    let oracle_id = env.register_contract(None, CarbonOracleContract);
    let oracle_client = CarbonOracleContractClient::new(&env, &oracle_id);

    let lifecycle_id = env.register_contract(None, LifecycleTrackerContract);
    let lifecycle_client = LifecycleTrackerContractClient::new(&env, &lifecycle_id);

    lifecycle_client.set_carbon_oracle(&admin, &oracle_id);

    let energy_factor = factor(&env, "raw_material_energy", 500);
    oracle_client.update_emission_factor(
        &admin,
        &String::from_str(&env, "raw_material_energy"),
        &energy_factor,
    );

    let fuel_factor = factor(&env, "raw_material_fuel", 3000);
    oracle_client.update_emission_factor(
        &admin,
        &String::from_str(&env, "raw_material_fuel"),
        &fuel_factor,
    );

    let data = event_data(&env, &admin, LifecycleStage::RawMaterialExtraction);
    lifecycle_client.record_event(&admin, &1u64, &data);

    let summary = lifecycle_client.get_lifecycle(&1u64);
    assert_eq!(summary.total_events, 1);
    assert!(summary.total_emissions > 0);
}

#[test]
fn test_lifecycle_falls_back_when_oracle_missing_factor() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);

    let oracle_id = env.register_contract(None, CarbonOracleContract);
    let oracle_client = CarbonOracleContractClient::new(&env, &oracle_id);

    let lifecycle_id = env.register_contract(None, LifecycleTrackerContract);
    let lifecycle_client = LifecycleTrackerContractClient::new(&env, &lifecycle_id);

    lifecycle_client.set_carbon_oracle(&admin, &oracle_id);

    let fuel_factor = factor(&env, "raw_material_fuel", 3000);
    oracle_client.update_emission_factor(
        &admin,
        &String::from_str(&env, "raw_material_fuel"),
        &fuel_factor,
    );

    let data = event_data(&env, &admin, LifecycleStage::RawMaterialExtraction);
    lifecycle_client.record_event(&admin, &1u64, &data);

    let summary = lifecycle_client.get_lifecycle(&1u64);
    assert_eq!(summary.total_events, 1);
    assert!(summary.total_emissions > 0);
}

#[test]
fn test_oracle_grid_intensity_affects_emissions() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);

    let oracle_id = env.register_contract(None, CarbonOracleContract);
    let oracle_client = CarbonOracleContractClient::new(&env, &oracle_id);

    let lifecycle_id = env.register_contract(None, LifecycleTrackerContract);
    let lifecycle_client = LifecycleTrackerContractClient::new(&env, &lifecycle_id);

    lifecycle_client.set_carbon_oracle(&admin, &oracle_id);

    oracle_client.update_grid_intensity(&admin, &String::from_str(&env, "global"), &800i128);

    let energy_factor = factor(&env, "raw_material_energy", 500);
    oracle_client.update_emission_factor(
        &admin,
        &String::from_str(&env, "raw_material_energy"),
        &energy_factor,
    );

    let data = event_data(&env, &admin, LifecycleStage::RawMaterialExtraction);
    lifecycle_client.record_event(&admin, &1u64, &data);

    let summary = lifecycle_client.get_lifecycle(&1u64);
    assert_eq!(summary.total_events, 1);
    assert!(summary.total_emissions > 0);
}

#[test]
fn test_full_oracle_lifecycle_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);

    let oracle_id = env.register_contract(None, CarbonOracleContract);
    let oracle_client = CarbonOracleContractClient::new(&env, &oracle_id);

    let lifecycle_id = env.register_contract(None, LifecycleTrackerContract);
    let lifecycle_client = LifecycleTrackerContractClient::new(&env, &lifecycle_id);

    lifecycle_client.set_carbon_oracle(&admin, &oracle_id);

    let energy = factor(&env, "raw_material_energy", 500);
    oracle_client.update_emission_factor(
        &admin,
        &String::from_str(&env, "raw_material_energy"),
        &energy,
    );
    let fuel = factor(&env, "raw_material_fuel", 3000);
    oracle_client.update_emission_factor(
        &admin,
        &String::from_str(&env, "raw_material_fuel"),
        &fuel,
    );
    let waste = factor(&env, "raw_material_waste", 800);
    oracle_client.update_emission_factor(
        &admin,
        &String::from_str(&env, "raw_material_waste"),
        &waste,
    );

    oracle_client.update_grid_intensity(&admin, &String::from_str(&env, "global"), &500i128);

    let data = event_data(&env, &admin, LifecycleStage::RawMaterialExtraction);
    let event_id = lifecycle_client.record_event(&admin, &1u64, &data);
    assert_eq!(event_id, 1);

    let methodology = oracle_client.get_methodology_version();
    assert_eq!(methodology, String::from_str(&env, "GHG Protocol 2024"));

    let summary = lifecycle_client.get_lifecycle(&1u64);
    assert!(summary.total_emissions > 0);
    assert_eq!(summary.product_id, 1);

    let oracle_get = oracle_client.get_emission_factor_value(&String::from_str(&env, "raw_material_energy"));
    assert_eq!(oracle_get, 500);
}
