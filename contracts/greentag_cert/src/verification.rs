use soroban_sdk::{Env, String};

use crate::types::CertificateRecord;

pub fn verify_off_chain(env: &Env, certificate: &CertificateRecord) -> bool {
    if certificate.is_revoked {
        return false;
    }
    if certificate.expires_at != 0 && env.ledger().timestamp() > certificate.expires_at {
        return false;
    }
    !certificate.metadata_ipfs_hash.is_empty()
}

pub fn verify_hash(certificate: &CertificateRecord, expected_hash: &String) -> bool {
    !certificate.metadata_ipfs_hash.is_empty() && certificate.metadata_ipfs_hash == *expected_hash
}

pub fn get_verification_url(env: &Env, _certificate_id: u64) -> String {
    String::from_str(env, "https://verdechain.io/verify/")
}
