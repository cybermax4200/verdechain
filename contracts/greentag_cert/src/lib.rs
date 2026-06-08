#![no_std]

pub mod templates;
pub mod types;
pub mod verification;

use soroban_sdk::{contract, contractimpl, Address, Env, String, Vec};

use shared::errors::Error;
use shared::types::CertType;

use crate::types::CertificateRecord;

#[contract]
pub struct GreenTagCertContract;

#[contractimpl]
impl GreenTagCertContract {
    pub fn issue_certificate(
        env: Env,
        issuer: Address,
        product_id: u64,
        cert_type: CertType,
        holder: Address,
        expires_at: u64,
        metadata_ipfs_hash: String,
    ) -> Result<u64, Error> {
        issuer.require_auth();

        if metadata_ipfs_hash.len() == 0 {
            return Err(Error::InvalidCertificateData);
        }
        if expires_at != 0 && expires_at <= env.ledger().timestamp() {
            return Err(Error::InvalidCertificateData);
        }

        let id = Self::next_certificate_id(&env);

        let record = CertificateRecord {
            id,
            product_id,
            cert_type: cert_type.clone(),
            issuer: issuer.clone(),
            holder: holder.clone(),
            issued_at: env.ledger().timestamp(),
            expires_at,
            revoked_at: 0,
            metadata_ipfs_hash: metadata_ipfs_hash.clone(),
            is_revoked: false,
            revocation_reason: String::from_str(&env, ""),
        };

        Self::save_certificate(&env, id, &record);
        Self::add_to_product_index(&env, product_id, id);
        Self::add_to_issuer_index(&env, &issuer, id);
        Self::set_next_certificate_id(&env, id + 1);

        env.events().publish(
            (soroban_sdk::Symbol::new(&env, "certificate_issued"),),
            (id, product_id, issuer, cert_type, holder),
        );

        Ok(id)
    }

    pub fn verify_certificate(env: Env, certificate_id: u64) -> Result<bool, Error> {
        let record = Self::load_certificate(&env, certificate_id)
            .ok_or(Error::CertificateNotFound)?;

        if record.is_revoked {
            return Ok(false);
        }

        if record.expires_at != 0 && env.ledger().timestamp() > record.expires_at {
            return Ok(false);
        }

        Ok(true)
    }

    pub fn revoke_certificate(
        env: Env,
        caller: Address,
        certificate_id: u64,
        reason: String,
    ) -> Result<(), Error> {
        caller.require_auth();

        let mut record = Self::load_certificate(&env, certificate_id)
            .ok_or(Error::CertificateNotFound)?;

        if caller != record.issuer {
            return Err(Error::Unauthorized);
        }

        if record.is_revoked {
            return Err(Error::CertificateAlreadyRevoked);
        }

        record.is_revoked = true;
        record.revoked_at = env.ledger().timestamp();
        record.revocation_reason = reason.clone();

        Self::save_certificate(&env, certificate_id, &record);

        env.events().publish(
            (soroban_sdk::Symbol::new(&env, "certificate_revoked"),),
            (certificate_id, caller, reason),
        );

        Ok(())
    }

    pub fn get_certificate(
        env: Env,
        certificate_id: u64,
    ) -> Result<CertificateRecord, Error> {
        Self::load_certificate(&env, certificate_id).ok_or(Error::CertificateNotFound)
    }

    pub fn get_certificates_for_product(
        env: Env,
        product_id: u64,
    ) -> Vec<CertificateRecord> {
        let index = Self::product_certificates(&env);
        let ids = index.get(product_id).unwrap_or(Vec::new(&env));
        let mut results = Vec::new(&env);
        for id in ids.iter() {
            if let Some(record) = Self::load_certificate(&env, id) {
                results.push_back(record);
            }
        }
        results
    }

    pub fn get_certificates_by_issuer(
        env: Env,
        issuer: Address,
    ) -> Vec<CertificateRecord> {
        let index = Self::issuer_certificates(&env);
        let ids = index.get(issuer).unwrap_or(Vec::new(&env));
        let mut results = Vec::new(&env);
        for id in ids.iter() {
            if let Some(record) = Self::load_certificate(&env, id) {
                results.push_back(record);
            }
        }
        results
    }
}

// Storage helpers
#[contractimpl]
impl GreenTagCertContract {
    fn next_certificate_id(env: &Env) -> u64 {
        env.storage()
            .instance()
            .get(&"next_id")
            .unwrap_or(1u64)
    }

    fn set_next_certificate_id(env: &Env, id: u64) {
        env.storage().instance().set(&"next_id", &id);
    }

    fn certificates(env: &Env) -> soroban_sdk::Map<u64, CertificateRecord> {
        env.storage()
            .instance()
            .get(&"certificates")
            .unwrap_or(soroban_sdk::Map::new(env))
    }

    fn set_certificates(env: &Env, map: &soroban_sdk::Map<u64, CertificateRecord>) {
        env.storage().instance().set(&"certificates", map);
    }

    fn load_certificate(env: &Env, id: u64) -> Option<CertificateRecord> {
        let map = Self::certificates(env);
        map.get(id)
    }

    fn save_certificate(env: &Env, id: u64, record: &CertificateRecord) {
        let mut map = Self::certificates(env);
        map.set(id, record.clone());
        Self::set_certificates(env, &map);
    }

    fn product_certificates(env: &Env) -> soroban_sdk::Map<u64, Vec<u64>> {
        env.storage()
            .instance()
            .get(&"product_certificates")
            .unwrap_or(soroban_sdk::Map::new(env))
    }

    fn set_product_certificates(env: &Env, map: &soroban_sdk::Map<u64, Vec<u64>>) {
        env.storage().instance().set(&"product_certificates", map);
    }

    fn add_to_product_index(env: &Env, product_id: u64, cert_id: u64) {
        let mut map = Self::product_certificates(env);
        let mut ids = map.get(product_id).unwrap_or(Vec::new(env));
        ids.push_back(cert_id);
        map.set(product_id, ids);
        Self::set_product_certificates(env, &map);
    }

    fn issuer_certificates(env: &Env) -> soroban_sdk::Map<Address, Vec<u64>> {
        env.storage()
            .instance()
            .get(&"issuer_certificates")
            .unwrap_or(soroban_sdk::Map::new(env))
    }

    fn set_issuer_certificates(env: &Env, map: &soroban_sdk::Map<Address, Vec<u64>>) {
        env.storage().instance().set(&"issuer_certificates", map);
    }

    fn add_to_issuer_index(env: &Env, issuer: &Address, cert_id: u64) {
        let mut map = Self::issuer_certificates(env);
        let mut ids = map.get(issuer.clone()).unwrap_or(Vec::new(env));
        ids.push_back(cert_id);
        map.set(issuer.clone(), ids);
        Self::set_issuer_certificates(env, &map);
    }
}
