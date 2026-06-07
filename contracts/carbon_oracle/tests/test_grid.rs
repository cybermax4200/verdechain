use soroban_sdk::{vec, Env, String, Address};
use soroban_sdk::testutils::Address as _;

use carbon_oracle::{CarbonOracleContract, CarbonOracleContractClient};
use shared::errors::Error;

fn setup() -> (Env, CarbonOracleContractClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let contract_id = env.register_contract(None, CarbonOracleContract);
    let client = CarbonOracleContractClient::new(&env, &contract_id);
    (env, client, admin)
}

#[test]
fn test_update_and_get_grid_intensity() {
    let (env, client, admin) = setup();
    client.update_grid_intensity(&admin, &String::from_str(&env, "US"), &500i128);

    let intensity = client.get_grid_intensity(&String::from_str(&env, "US"));
    assert_eq!(intensity, 500);
}

#[test]
fn test_get_nonexistent_grid_intensity_returns_zero() {
    let (env, client, _admin) = setup();
    let intensity = client.get_grid_intensity(&String::from_str(&env, "Mars"));
    assert_eq!(intensity, 0);
}

#[test]
fn test_update_negative_grid_intensity_fails() {
    let (env, client, admin) = setup();
    let result = client.try_update_grid_intensity(
        &admin,
        &String::from_str(&env, "US"),
        &(-100i128),
    );
    assert_eq!(result.err().unwrap(), Ok(Error::InvalidInput));
}

#[test]
fn test_batch_update_grid_intensities() {
    let (env, client, admin) = setup();
    let entries = vec![
        &env,
        (String::from_str(&env, "US"), 500i128),
        (String::from_str(&env, "EU"), 300i128),
        (String::from_str(&env, "India"), 700i128),
    ];

    client.update_grid_intensities_batch(&admin, &entries);

    assert_eq!(client.get_grid_intensity(&String::from_str(&env, "US")), 500);
    assert_eq!(client.get_grid_intensity(&String::from_str(&env, "EU")), 300);
    assert_eq!(client.get_grid_intensity(&String::from_str(&env, "India")), 700);
}

#[test]
fn test_batch_update_with_negative_intensity_fails() {
    let (env, client, admin) = setup();
    let entries = vec![
        &env,
        (String::from_str(&env, "US"), 500i128),
        (String::from_str(&env, "Bad"), (-100i128)),
    ];

    let result = client.try_update_grid_intensities_batch(&admin, &entries);
    assert_eq!(result.err().unwrap(), Ok(Error::InvalidInput));
}
