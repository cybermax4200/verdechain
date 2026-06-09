#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env, String,
};

use verifier_registry::VerifierRegistryContract;
use verifier_registry::VerifierRegistryContractClient;

fn setup_with_verifier() -> (Env, VerifierRegistryContractClient<'static>, u64, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let verifier = Address::generate(&env);
    let admin = Address::generate(&env);

    let contract_id = env.register_contract(None, VerifierRegistryContract);
    let client = VerifierRegistryContractClient::new(&env, &contract_id);

    let name = String::from_str(&env, "Reputable Verifier");
    let stake: i128 = 10_000_000_000;

    let id = client.register_verifier(&verifier, &admin, &name, &stake);

    (env, client, id, verifier)
}

#[test]
fn test_initial_reputation_is_zero() {
    let (_, client, id, _verifier) = setup_with_verifier();

    let score = client.get_reputation(&id);
    assert_eq!(score.overall_score, 0);
    assert_eq!(score.total_attestations, 0);
}

#[test]
fn test_reputation_increases_with_successful_attestations() {
    let (_env, client, id, _verifier) = setup_with_verifier();

    let score1 = client.update_reputation(&id, &true);
    assert_eq!(score1.total_attestations, 1);
    assert_eq!(score1.successful_attestations, 1);
    assert!(score1.overall_score > 0);

    let score2 = client.update_reputation(&id, &true);
    assert_eq!(score2.total_attestations, 2);
    assert_eq!(score2.successful_attestations, 2);

    assert!(score2.overall_score >= score1.overall_score);
}

#[test]
fn test_reputation_with_mixed_results() {
    let (_env, client, id, _verifier) = setup_with_verifier();

    for _ in 0..8 {
        client.update_reputation(&id, &true);
    }

    let score_after_good = client.get_reputation(&id);
    assert_eq!(score_after_good.total_attestations, 8);
    assert_eq!(score_after_good.successful_attestations, 8);

    client.update_reputation(&id, &false);
    client.update_reputation(&id, &false);

    let score_after_mixed = client.get_reputation(&id);
    assert_eq!(score_after_mixed.total_attestations, 10);
    assert_eq!(score_after_mixed.successful_attestations, 8);
    assert_eq!(score_after_mixed.failed_attestations, 2);
    assert_eq!(score_after_mixed.accuracy_score, 80);
}

#[test]
fn test_verifier_rankings() {
    let (env, _client, _id, _verifier) = setup_with_verifier();

    let verifier2 = Address::generate(&env);
    let admin2 = Address::generate(&env);

    let contract_id = env.register_contract(None, VerifierRegistryContract);
    let client = VerifierRegistryContractClient::new(&env, &contract_id);

    let id1 = client.register_verifier(
        &_verifier,
        &_verifier,
        &String::from_str(&env, "First"),
        &10_000_000_000,
    );
    let id2 = client.register_verifier(
        &verifier2,
        &admin2,
        &String::from_str(&env, "Second"),
        &10_000_000_000,
    );

    client.update_reputation(&id1, &true);
    client.update_reputation(&id1, &true);

    client.update_reputation(&id2, &true);
    client.update_reputation(&id2, &false);

    let rankings = client.get_verifier_rankings();
    assert_eq!(rankings.len(), 2);
}

#[test]
fn test_reputation_has_correct_weights() {
    let (env, client, id, _verifier) = setup_with_verifier();

    env.ledger().set_timestamp(31_536_000);

    let score = client.get_reputation(&id);
    assert_eq!(score.longevity_score, 100);
}
