#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env, String,
};

use verifier_registry::VerifierRegistryContract;
use verifier_registry::VerifierRegistryContractClient;
use shared::types::VerifierStatus;

fn setup_test() -> (Env, Address, Address, VerifierRegistryContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();

    let verifier = Address::generate(&env);
    let admin = Address::generate(&env);

    let contract_id = env.register_contract(None, VerifierRegistryContract);
    let client = VerifierRegistryContractClient::new(&env, &contract_id);

    (env, verifier, admin, client)
}

#[test]
fn test_register_verifier_success() {
    let (env, verifier, admin, client) = setup_test();

    let name = String::from_str(&env, "EcoVerify Corp");
    let initial_stake: i128 = 10_000_000_000;

    let id = client.register_verifier(&verifier, &admin, &name, &initial_stake);
    assert_eq!(id, 1u64);

    let record = client.get_verifier(&id);
    assert_eq!(record.verifier, verifier);
    assert_eq!(record.admin, admin);
    assert_eq!(record.name, name);
    assert_eq!(record.status, VerifierStatus::Active);

    let stake = client.get_verifier_stake(&id);
    assert_eq!(stake.amount, initial_stake);
}

#[test]
fn test_register_verifier_insufficient_stake() {
    let (env, verifier, admin, client) = setup_test();

    let name = String::from_str(&env, "LowStake Verifier");
    let low_stake: i128 = 1_000_000_000;

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.register_verifier(&verifier, &admin, &name, &low_stake);
    }));
    assert!(result.is_err());
}

#[test]
fn test_register_verifier_duplicate() {
    let (env, verifier, admin, client) = setup_test();

    let name = String::from_str(&env, "Duplicate Inc");
    let stake: i128 = 10_000_000_000;

    client.register_verifier(&verifier, &admin, &name, &stake);

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.register_verifier(&verifier, &admin, &name, &stake);
    }));
    assert!(result.is_err());
}

#[test]
fn test_add_stake_increases_balance() {
    let (env, verifier, admin, client) = setup_test();

    let name = String::from_str(&env, "StakeBuilder");
    let stake: i128 = 10_000_000_000;

    let id = client.register_verifier(&verifier, &admin, &name, &stake);

    let additional: i128 = 5_000_000_000;
    client.add_stake(&verifier, &additional);

    let stake_record = client.get_verifier_stake(&id);
    assert_eq!(stake_record.amount, 15_000_000_000);
}

#[test]
fn test_request_stake_withdrawal_sets_cooldown() {
    let (env, verifier, admin, client) = setup_test();

    // Set non-zero timestamp so cooldown_start != 0 sentinel
    env.ledger().set_timestamp(100_000);

    let name = String::from_str(&env, "Withdrawer");
    let stake: i128 = 20_000_000_000;

    let _id = client.register_verifier(&verifier, &admin, &name, &stake);

    let withdraw_amount: i128 = 5_000_000_000;
    client.request_stake_withdrawal(&verifier, &withdraw_amount);

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.request_stake_withdrawal(&verifier, &withdraw_amount);
    }));
    assert!(result.is_err());
}

#[test]
fn test_request_withdrawal_below_minimum_fails() {
    let (env, verifier, admin, client) = setup_test();

    let name = String::from_str(&env, "Overdrawer");
    let stake: i128 = 10_000_000_000;

    client.register_verifier(&verifier, &admin, &name, &stake);

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.request_stake_withdrawal(&verifier, &1_000_000_000);
    }));
    assert!(result.is_err());
}

#[test]
fn test_complete_stake_withdrawal_after_cooldown() {
    let env = Env::default();
    env.mock_all_auths();

    // Set initial non-zero timestamp
    env.ledger().set_timestamp(100_000);

    let verifier = Address::generate(&env);
    let admin = Address::generate(&env);

    let contract_id = env.register_contract(None, VerifierRegistryContract);
    let client = VerifierRegistryContractClient::new(&env, &contract_id);

    let name = String::from_str(&env, "Patient Verifier");
    let stake: i128 = 20_000_000_000;

    let id = client.register_verifier(&verifier, &admin, &name, &stake);

    let withdraw_amount: i128 = 5_000_000_000;
    client.request_stake_withdrawal(&verifier, &withdraw_amount);

    // Jump past cooldown: 100_000 + 604_800 + 1
    env.ledger().set_timestamp(704_801);

    let withdrawn = client.complete_stake_withdrawal(&verifier);
    assert_eq!(withdrawn, 10_000_000_000);

    let stake_record = client.get_verifier_stake(&id);
    assert_eq!(stake_record.amount, 10_000_000_000);
}

#[test]
fn test_get_verifier_by_address() {
    let (env, verifier, admin, client) = setup_test();

    let name = String::from_str(&env, "Findable Verifier");
    let stake: i128 = 10_000_000_000;

    let id = client.register_verifier(&verifier, &admin, &name, &stake);

    let found = client.get_verifier_by_address(&verifier);
    assert_eq!(found.id, id);
    assert_eq!(found.verifier, verifier);
}

#[test]
fn test_heartbeat_updates_last_active() {
    let (env, verifier, admin, client) = setup_test();

    let name = String::from_str(&env, "Active Verifier");
    let stake: i128 = 10_000_000_000;

    let id = client.register_verifier(&verifier, &admin, &name, &stake);

    env.ledger().set_timestamp(86_400);
    client.heartbeat(&verifier);

    let record = client.get_verifier(&id);
    assert_eq!(record.last_active, 86_400);
}
