use soroban_sdk::{vec, Env, String, Address};
use soroban_sdk::testutils::Address as _;

use carbon_oracle::{CarbonOracleContract, CarbonOracleContractClient};
use carbon_oracle::types::EmissionFactor;
use shared::errors::Error;

fn create_factor(env: &Env, activity: &str, value: i128, unit: &str, source: &str) -> EmissionFactor {
    EmissionFactor {
        activity_type: String::from_str(env, activity),
        factor_value: value,
        unit: String::from_str(env, unit),
        source: String::from_str(env, source),
        region: String::from_str(env, "global"),
    }
}

fn setup() -> (Env, CarbonOracleContractClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let contract_id = env.register_contract(None, CarbonOracleContract);
    let client = CarbonOracleContractClient::new(&env, &contract_id);
    (env, client, admin)
}

#[test]
fn test_update_and_get_factor() {
    let (env, client, admin) = setup();
    let factor = create_factor(&env, "electricity", 475, "gCO2e/kWh", "IPCC 2024");

    client.update_emission_factor(&admin, &String::from_str(&env, "electricity"), &factor);

    let retrieved = client.get_emission_factor(&String::from_str(&env, "electricity"));
    assert_eq!(retrieved.factor_value, 475);
    assert_eq!(retrieved.unit, String::from_str(&env, "gCO2e/kWh"));
    assert_eq!(retrieved.source, String::from_str(&env, "IPCC 2024"));
}

#[test]
fn test_get_nonexistent_factor_fails() {
    let (env, client, _admin) = setup();
    let result = client.try_get_emission_factor(&String::from_str(&env, "nonexistent"));
    assert_eq!(result.err().unwrap(), Ok(Error::NotFound));
}

#[test]
fn test_update_empty_activity_type_fails() {
    let (env, client, admin) = setup();
    let factor = create_factor(&env, "", 475, "gCO2e/kWh", "IPCC 2024");
    let result = client.try_update_emission_factor(
        &admin,
        &String::from_str(&env, ""),
        &factor,
    );
    assert_eq!(result.err().unwrap(), Ok(Error::InvalidInput));
}

#[test]
fn test_update_negative_factor_value_fails() {
    let (env, client, admin) = setup();
    let factor = create_factor(&env, "electricity", -100, "gCO2e/kWh", "IPCC 2024");
    let result = client.try_update_emission_factor(
        &admin,
        &String::from_str(&env, "electricity"),
        &factor,
    );
    assert_eq!(result.err().unwrap(), Ok(Error::InvalidInput));
}

#[test]
fn test_batch_update_factors() {
    let (env, client, admin) = setup();
    let factor1 = create_factor(&env, "electricity", 475, "gCO2e/kWh", "IPCC 2024");
    let factor2 = create_factor(&env, "diesel", 2680, "gCO2e/kg", "EPA 2024");

    let entries = vec![
        &env,
        (String::from_str(&env, "electricity"), factor1),
        (String::from_str(&env, "diesel"), factor2),
    ];

    client.update_emission_factors_batch(&admin, &entries);

    let f1 = client.get_emission_factor(&String::from_str(&env, "electricity"));
    assert_eq!(f1.factor_value, 475);

    let f2 = client.get_emission_factor(&String::from_str(&env, "diesel"));
    assert_eq!(f2.factor_value, 2680);
}

#[test]
fn test_batch_update_overwrites_previous() {
    let (env, client, admin) = setup();
    let factor1 = create_factor(&env, "electricity", 475, "gCO2e/kWh", "IPCC 2024");
    client.update_emission_factor(&admin, &String::from_str(&env, "electricity"), &factor1);

    let factor2 = create_factor(&env, "electricity", 500, "gCO2e/kWh", "EPA 2024");
    let entries = vec![&env, (String::from_str(&env, "electricity"), factor2)];
    client.update_emission_factors_batch(&admin, &entries);

    let retrieved = client.get_emission_factor(&String::from_str(&env, "electricity"));
    assert_eq!(retrieved.factor_value, 500);
    assert_eq!(retrieved.source, String::from_str(&env, "EPA 2024"));
}

#[test]
fn test_get_factor_value_returns_correct() {
    let (env, client, admin) = setup();
    let factor = create_factor(&env, "electricity", 475, "gCO2e/kWh", "IPCC 2024");
    client.update_emission_factor(&admin, &String::from_str(&env, "electricity"), &factor);

    let value = client.get_emission_factor_value(&String::from_str(&env, "electricity"));
    assert_eq!(value, 475);
}

#[test]
fn test_get_factor_value_unknown_returns_zero() {
    let (env, client, _admin) = setup();
    let value = client.get_emission_factor_value(&String::from_str(&env, "unknown"));
    assert_eq!(value, 0);
}
