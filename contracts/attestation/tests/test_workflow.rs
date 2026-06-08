#![cfg(test)]

use soroban_sdk::{
    testutils::Address as _,
    Address, Env, String, Vec,
};

use attestation::AttestationContract;
use attestation::AttestationContractClient;
use shared::types::AttestationStatus;

fn setup_test() -> (Env, Address, u64, Vec<Address>, AttestationContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();

    let submitter = Address::generate(&env);
    let verifier1 = Address::generate(&env);
    let verifier2 = Address::generate(&env);
    let verifier3 = Address::generate(&env);
    let verifiers = Vec::from_array(&env, [verifier1, verifier2, verifier3]);

    let contract_id = env.register_contract(None, AttestationContract);
    let client = AttestationContractClient::new(&env, &contract_id);

    let product_id = 1u64;

    (env, submitter, product_id, verifiers, client)
}

#[test]
fn test_submit_attestation() {
    let (_env, submitter, product_id, verifiers, client) = setup_test();

    let ipfs_hash = String::from_str(&_env, "QmTestAttestation");
    let id = client.submit_for_attestation(&submitter, &product_id, &verifiers, &ipfs_hash);

    let record = client.get_attestation(&id);
    assert_eq!(record.product_id, product_id);
    assert_eq!(record.submitter, submitter);
    assert_eq!(record.status, AttestationStatus::Pending);
    assert_eq!(record.evidence_ipfs_hash, ipfs_hash);
}

#[test]
fn test_approve_attestation_happy_path() {
    let (env, _submitter, product_id, verifiers, client) = setup_test();

    let ipfs_hash = String::from_str(&env, "QmApproval");
    let id = client.submit_for_attestation(&_submitter, &product_id, &verifiers, &ipfs_hash);

    client.approve_attestation(&verifiers.get(0).unwrap(), &id);
    client.approve_attestation(&verifiers.get(1).unwrap(), &id);
    client.approve_attestation(&verifiers.get(2).unwrap(), &id);

    let record = client.get_attestation(&id);
    assert_eq!(record.status, AttestationStatus::Approved);
    assert_eq!(record.approvals.len(), 3);
}

#[test]
fn test_reject_attestation() {
    let (env, _submitter, product_id, verifiers, client) = setup_test();

    let ipfs_hash = String::from_str(&env, "QmReject");
    let id = client.submit_for_attestation(&_submitter, &product_id, &verifiers, &ipfs_hash);

    let reason = String::from_str(&env, "Insufficient evidence");
    client.reject_attestation(&verifiers.get(0).unwrap(), &id, &reason);
    client.reject_attestation(&verifiers.get(1).unwrap(), &id, &reason);
    client.reject_attestation(&verifiers.get(2).unwrap(), &id, &reason);

    let record = client.get_attestation(&id);
    assert_eq!(record.status, AttestationStatus::Rejected);
    assert_eq!(record.rejections.len(), 3);
}

#[test]
fn test_escalate_attestation() {
    let (env, _submitter, product_id, verifiers, client) = setup_test();

    let ipfs_hash = String::from_str(&env, "QmEscalate");
    let id = client.submit_for_attestation(&_submitter, &product_id, &verifiers, &ipfs_hash);

    let additional = Address::generate(&env);
    let additional2 = Address::generate(&env);
    let additional_verifiers = Vec::from_array(&env, [additional.clone(), additional2.clone()]);

    client.escalate_attestation(&_submitter, &id, &additional_verifiers);

    let record = client.get_attestation(&id);
    assert_eq!(record.status, AttestationStatus::Escalated);
    assert_eq!(record.verifiers.len(), 5);
}

#[test]
fn test_attestation_threshold_not_reached() {
    let (env, _submitter, product_id, verifiers, client) = setup_test();

    let ipfs_hash = String::from_str(&env, "QmPartial");
    let id = client.submit_for_attestation(&_submitter, &product_id, &verifiers, &ipfs_hash);

    client.approve_attestation(&verifiers.get(0).unwrap(), &id);

    let record = client.get_attestation(&id);
    assert_eq!(record.status, AttestationStatus::Pending);
    assert_eq!(record.approvals.len(), 1);
}

#[test]
fn test_double_vote_rejected() {
    let (env, _submitter, product_id, verifiers, client) = setup_test();

    let ipfs_hash = String::from_str(&env, "QmDouble");
    let id = client.submit_for_attestation(&_submitter, &product_id, &verifiers, &ipfs_hash);

    client.approve_attestation(&verifiers.get(0).unwrap(), &id);

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.approve_attestation(&verifiers.get(0).unwrap(), &id);
    }));
    assert!(result.is_err());
}

#[test]
fn test_get_attestations_for_product() {
    let (env, _submitter, product_id, verifiers, client) = setup_test();

    let ipfs_hash1 = String::from_str(&env, "QmFirst");
    let ipfs_hash2 = String::from_str(&env, "QmSecond");

    client.submit_for_attestation(&_submitter, &product_id, &verifiers, &ipfs_hash1);
    client.submit_for_attestation(&_submitter, &product_id, &verifiers, &ipfs_hash2);

    let attestations = client.get_attestations_for_product(&product_id);
    assert_eq!(attestations.len(), 2);
}

#[test]
fn test_get_pending_for_verifier() {
    let (env, _submitter, product_id, verifiers, client) = setup_test();

    let ipfs_hash = String::from_str(&env, "QmPending");
    let _id = client.submit_for_attestation(&_submitter, &product_id, &verifiers, &ipfs_hash);

    let pending = client.get_pending_for_verifier(&verifiers.get(0).unwrap());
    assert_eq!(pending.len(), 1);
}

#[test]
fn test_unauthorized_verifier_rejected() {
    let (env, _submitter, product_id, verifiers, client) = setup_test();

    let ipfs_hash = String::from_str(&env, "QmUnauth");
    let id = client.submit_for_attestation(&_submitter, &product_id, &verifiers, &ipfs_hash);

    let unauthorized = Address::generate(&env);
    let reason = String::from_str(&env, "Bad");

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.reject_attestation(&unauthorized, &id, &reason);
    }));
    assert!(result.is_err());
}

#[test]
fn test_submit_with_insufficient_verifiers() {
    let env = Env::default();
    env.mock_all_auths();

    let submitter = Address::generate(&env);
    let verifier1 = Address::generate(&env);
    let verifiers = Vec::from_array(&env, [verifier1]);

    let contract_id = env.register_contract(None, AttestationContract);
    let client = AttestationContractClient::new(&env, &contract_id);

    let ipfs_hash = String::from_str(&env, "QmFail");

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.submit_for_attestation(&submitter, &1u64, &verifiers, &ipfs_hash);
    }));
    assert!(result.is_err());
}
