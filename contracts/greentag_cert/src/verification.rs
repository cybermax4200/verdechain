use soroban_sdk::{Env, String};

use crate::types::CertificateRecord;

pub fn verify_off_chain(_env: &Env, _certificate: &CertificateRecord) -> bool {
    false
}

pub fn verify_hash(_certificate: &CertificateRecord, _expected_hash: &String) -> bool {
    false
}

pub fn get_verification_url(_env: &Env, _certificate_id: u64) -> String {
    String::from_str(_env, "")
}
