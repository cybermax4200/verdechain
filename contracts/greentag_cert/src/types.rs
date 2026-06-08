use soroban_sdk::{contracttype, Address, String};

use shared::types::CertType;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CertificateRecord {
    pub id: u64,
    pub product_id: u64,
    pub cert_type: CertType,
    pub issuer: Address,
    pub holder: Address,
    pub issued_at: u64,
    pub expires_at: u64,
    pub revoked_at: u64,
    pub metadata_ipfs_hash: String,
    pub is_revoked: bool,
    pub revocation_reason: String,
}
