#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env, String,
};

use greentag_cert::{GreenTagCertContract, GreenTagCertContractClient};
use shared::types::CertType;

fn setup_test() -> (Env, Address, Address, GreenTagCertContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_000);

    let issuer = Address::generate(&env);
    let holder = Address::generate(&env);

    let contract_id = env.register_contract(None, GreenTagCertContract);
    let client = GreenTagCertContractClient::new(&env, &contract_id);

    (env, issuer, holder, client)
}

#[test]
fn test_issue_certificate_success() {
    let (env, issuer, holder, client) = setup_test();

    let product_id = 42u64;
    let cert_type = CertType::CarbonNeutral;
    let expires_at = env.ledger().timestamp() + 86400 * 365;
    let ipfs_hash = String::from_str(&env, "QmZtmD2qt8fJpq3CLDHcg534346p37J1G26nB497fnhWLF");

    let cert_id = client.issue_certificate(
        &issuer,
        &product_id,
        &cert_type,
        &holder,
        &expires_at,
        &ipfs_hash,
    );

    assert_eq!(cert_id, 1);

    let cert = client.get_certificate(&cert_id);
    assert_eq!(cert.id, 1);
    assert_eq!(cert.product_id, product_id);
    assert_eq!(cert.cert_type, CertType::CarbonNeutral);
    assert_eq!(cert.issuer, issuer);
    assert_eq!(cert.holder, holder);
    assert_eq!(cert.expires_at, expires_at);
    assert_eq!(cert.is_revoked, false);
    assert_eq!(cert.metadata_ipfs_hash, ipfs_hash);
}

#[test]
fn test_issue_multiple_certificates_increments_id() {
    let (env, issuer, holder, client) = setup_test();

    let ipfs_hash = String::from_str(&env, "QmZtmD2qt8fJpq3CLDHcg534346p37J1G26nB497fnhWLF");
    let expires_at = env.ledger().timestamp() + 10000;

    let cert1 = client.issue_certificate(
        &issuer,
        &101u64,
        &CertType::Organic,
        &holder,
        &expires_at,
        &ipfs_hash,
    );
    let cert2 = client.issue_certificate(
        &issuer,
        &102u64,
        &CertType::FairTrade,
        &holder,
        &expires_at,
        &ipfs_hash,
    );

    assert_eq!(cert1, 1);
    assert_eq!(cert2, 2);
}

#[test]
fn test_issue_certificate_empty_ipfs_hash_fails() {
    let (env, issuer, holder, client) = setup_test();

    let empty_hash = String::from_str(&env, "");
    let expires_at = env.ledger().timestamp() + 10000;

    let result = client.try_issue_certificate(
        &issuer,
        &1u64,
        &CertType::CarbonNeutral,
        &holder,
        &expires_at,
        &empty_hash,
    );

    assert!(result.is_err());
}

#[test]
fn test_issue_certificate_expired_timestamp_fails() {
    let (env, issuer, holder, client) = setup_test();

    env.ledger().set_timestamp(100_000);
    let past_timestamp = 50_000u64;
    let ipfs_hash = String::from_str(&env, "QmValidHash");

    let result = client.try_issue_certificate(
        &issuer,
        &1u64,
        &CertType::CarbonNeutral,
        &holder,
        &past_timestamp,
        &ipfs_hash,
    );

    assert!(result.is_err());
}

#[test]
fn test_verify_valid_certificate() {
    let (env, issuer, holder, client) = setup_test();

    let expires_at = env.ledger().timestamp() + 100_000;
    let ipfs_hash = String::from_str(&env, "QmValidHash");

    let cert_id = client.issue_certificate(
        &issuer,
        &1u64,
        &CertType::EnergyStar,
        &holder,
        &expires_at,
        &ipfs_hash,
    );

    let is_valid = client.verify_certificate(&cert_id);
    assert_eq!(is_valid, true);
}

#[test]
fn test_verify_expired_certificate() {
    let (env, issuer, holder, client) = setup_test();

    env.ledger().set_timestamp(10_000);
    let expires_at = 20_000u64;
    let ipfs_hash = String::from_str(&env, "QmValidHash");

    let cert_id = client.issue_certificate(
        &issuer,
        &1u64,
        &CertType::EnergyStar,
        &holder,
        &expires_at,
        &ipfs_hash,
    );

    // Fast-forward ledger time past expiration
    env.ledger().set_timestamp(25_000);

    let is_valid = client.verify_certificate(&cert_id);
    assert_eq!(is_valid, false);
}

#[test]
fn test_revoke_certificate_success() {
    let (env, issuer, holder, client) = setup_test();

    let expires_at = env.ledger().timestamp() + 100_000;
    let ipfs_hash = String::from_str(&env, "QmValidHash");

    let cert_id = client.issue_certificate(
        &issuer,
        &1u64,
        &CertType::RecycledContent,
        &holder,
        &expires_at,
        &ipfs_hash,
    );

    let reason = String::from_str(&env, "Auditing detected non-compliance");
    client.revoke_certificate(&issuer, &cert_id, &reason);

    let cert = client.get_certificate(&cert_id);
    assert_eq!(cert.is_revoked, true);
    assert_eq!(cert.revocation_reason, reason);
    assert_ne!(cert.revoked_at, 0);

    // Verification must now fail
    let is_valid = client.verify_certificate(&cert_id);
    assert_eq!(is_valid, false);
}

#[test]
fn test_revoke_certificate_unauthorized_fails() {
    let (env, issuer, holder, client) = setup_test();

    let impostor = Address::generate(&env);
    let expires_at = env.ledger().timestamp() + 100_000;
    let ipfs_hash = String::from_str(&env, "QmValidHash");

    let cert_id = client.issue_certificate(
        &issuer,
        &1u64,
        &CertType::BCorp,
        &holder,
        &expires_at,
        &ipfs_hash,
    );

    let reason = String::from_str(&env, "Unauthorized attempt");
    let result = client.try_revoke_certificate(&impostor, &cert_id, &reason);
    assert!(result.is_err());
}

#[test]
fn test_revoke_already_revoked_certificate_fails() {
    let (env, issuer, holder, client) = setup_test();

    let expires_at = env.ledger().timestamp() + 100_000;
    let ipfs_hash = String::from_str(&env, "QmValidHash");

    let cert_id = client.issue_certificate(
        &issuer,
        &1u64,
        &CertType::CradleToCradle,
        &holder,
        &expires_at,
        &ipfs_hash,
    );

    let reason = String::from_str(&env, "Revoked once");
    client.revoke_certificate(&issuer, &cert_id, &reason);

    let reason2 = String::from_str(&env, "Revoked twice");
    let result = client.try_revoke_certificate(&issuer, &cert_id, &reason2);
    assert!(result.is_err());
}

#[test]
fn test_get_certificates_for_product() {
    let (env, issuer, holder, client) = setup_test();

    let product_id = 999u64;
    let expires_at = env.ledger().timestamp() + 100_000;
    let ipfs_hash = String::from_str(&env, "QmValidHash");

    client.issue_certificate(
        &issuer,
        &product_id,
        &CertType::CarbonNeutral,
        &holder,
        &expires_at,
        &ipfs_hash,
    );

    client.issue_certificate(
        &issuer,
        &product_id,
        &CertType::Organic,
        &holder,
        &expires_at,
        &ipfs_hash,
    );

    // Another product's cert
    client.issue_certificate(
        &issuer,
        &888u64,
        &CertType::FairTrade,
        &holder,
        &expires_at,
        &ipfs_hash,
    );

    let product_certs = client.get_certificates_for_product(&product_id);
    assert_eq!(product_certs.len(), 2);
    assert_eq!(product_certs.get(0).unwrap().cert_type, CertType::CarbonNeutral);
    assert_eq!(product_certs.get(1).unwrap().cert_type, CertType::Organic);
}

#[test]
fn test_get_certificates_by_issuer() {
    let (env, issuer, holder, client) = setup_test();

    let other_issuer = Address::generate(&env);
    let expires_at = env.ledger().timestamp() + 100_000;
    let ipfs_hash = String::from_str(&env, "QmValidHash");

    client.issue_certificate(
        &issuer,
        &1u64,
        &CertType::Organic,
        &holder,
        &expires_at,
        &ipfs_hash,
    );

    client.issue_certificate(
        &other_issuer,
        &2u64,
        &CertType::FairTrade,
        &holder,
        &expires_at,
        &ipfs_hash,
    );

    let issuer_certs = client.get_certificates_by_issuer(&issuer);
    assert_eq!(issuer_certs.len(), 1);
    assert_eq!(issuer_certs.get(0).unwrap().issuer, issuer);
}
