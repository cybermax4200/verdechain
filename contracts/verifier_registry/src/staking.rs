use soroban_sdk::{Address, Env, Map};

use shared::constants::{MIN_STAKE, STAKE_LOCK_PERIOD};
use shared::errors::Error;
use shared::types::VerifierStatus;

use crate::types::{StakeRecord, VerifierRecord};

pub fn register_verifier(
    env: &Env,
    verifier: &Address,
    admin: &Address,
    name: soroban_sdk::String,
    initial_stake: i128,
) -> Result<u64, Error> {
    if initial_stake < MIN_STAKE {
        return Err(Error::InsufficientStake);
    }

    if name.is_empty() {
        return Err(Error::InvalidInput);
    }

    let by_address = get_verifier_by_address_map(env);
    if by_address.contains_key(verifier.clone()) {
        return Err(Error::VerifierAlreadyRegistered);
    }

    let id = next_verifier_id(env);
    let record = VerifierRecord {
        id,
        verifier: verifier.clone(),
        admin: admin.clone(),
        name: name.clone(),
        status: VerifierStatus::Active,
        registered_at: env.ledger().timestamp(),
        last_active: env.ledger().timestamp(),
    };

    let stake = StakeRecord {
        amount: initial_stake,
        locked_until: 0,
        withdrawal_requested_at: 0,
        cooldown_start: 0,
    };

    let mut verifiers = get_all_verifiers_map(env);
    verifiers.set(id, record.clone());
    set_verifiers(env, &verifiers);

    let mut stakes = get_all_stakes_map(env);
    stakes.set(id, stake);
    set_stakes(env, &stakes);

    let mut by_addr = by_address;
    by_addr.set(verifier.clone(), id);
    set_verifier_by_address(env, &by_addr);

    set_next_verifier_id(env, id + 1);

    env.events().publish(
        (soroban_sdk::Symbol::new(env, "verifier_registered"),),
        (id, verifier.clone(), name, initial_stake),
    );

    Ok(id)
}

pub fn add_stake(env: &Env, verifier: &Address, amount: i128) -> Result<(), Error> {
    if amount <= 0 {
        return Err(Error::InvalidInput);
    }

    let id = resolve_verifier_id(env, verifier)?;
    let record = get_verifier_record(env, id)?;

    if record.status != VerifierStatus::Active && record.status != VerifierStatus::Inactive {
        return Err(Error::VerifierNotActive);
    }

    let mut stakes = get_all_stakes_map(env);
    let mut stake = stakes.get(id).unwrap_or(StakeRecord {
        amount: 0,
        locked_until: 0,
        withdrawal_requested_at: 0,
        cooldown_start: 0,
    });

    stake.amount += amount;
    stakes.set(id, stake.clone());
    set_stakes(env, &stakes);

    if record.status == VerifierStatus::Inactive {
        let mut verifiers = get_all_verifiers_map(env);
        let mut updated = record;
        updated.status = VerifierStatus::Active;
        updated.last_active = env.ledger().timestamp();
        verifiers.set(id, updated);
        set_verifiers(env, &verifiers);
    }

    env.events().publish(
        (soroban_sdk::Symbol::new(env, "stake_added"),),
        (id, verifier.clone(), amount, stake.amount),
    );

    Ok(())
}

pub fn request_stake_withdrawal(
    env: &Env,
    verifier: &Address,
    amount: i128,
) -> Result<(), Error> {
    if amount <= 0 {
        return Err(Error::InvalidInput);
    }

    let id = resolve_verifier_id(env, verifier)?;
    let mut stakes = get_all_stakes_map(env);
    let mut stake = stakes.get(id).ok_or(Error::VerifierNotFound)?;

    if stake.amount < amount {
        return Err(Error::InsufficientStake);
    }

    if stake.amount - amount < MIN_STAKE {
        return Err(Error::InsufficientStake);
    }

    if stake.withdrawal_requested_at != 0 {
        return Err(Error::StakeLocked);
    }

    stake.withdrawal_requested_at = env.ledger().timestamp();
    stake.cooldown_start = env.ledger().timestamp();
    stakes.set(id, stake.clone());
    set_stakes(env, &stakes);

    env.events().publish(
        (soroban_sdk::Symbol::new(env, "withdrawal_requested"),),
        (id, verifier.clone(), amount),
    );

    Ok(())
}

pub fn complete_stake_withdrawal(
    env: &Env,
    verifier: &Address,
) -> Result<i128, Error> {
    let id = resolve_verifier_id(env, verifier)?;
    let mut stakes = get_all_stakes_map(env);
    let mut stake = stakes.get(id).ok_or(Error::VerifierNotFound)?;

    if stake.withdrawal_requested_at == 0 {
        return Err(Error::StakeLocked);
    }

    let now = env.ledger().timestamp();
    if now < stake.cooldown_start + STAKE_LOCK_PERIOD {
        return Err(Error::StakeLocked);
    }

    let excess = stake.amount - MIN_STAKE;
    stake.amount = MIN_STAKE;
    stake.withdrawal_requested_at = 0;
    stake.cooldown_start = 0;
    stakes.set(id, stake.clone());
    set_stakes(env, &stakes);

    env.events().publish(
        (soroban_sdk::Symbol::new(env, "withdrawal_completed"),),
        (id, verifier.clone(), excess),
    );

    Ok(excess)
}

pub fn get_stake(env: &Env, verifier_id: u64) -> StakeRecord {
    let stakes = get_all_stakes_map(env);
    stakes.get(verifier_id).unwrap_or(StakeRecord {
        amount: 0,
        locked_until: 0,
        withdrawal_requested_at: 0,
        cooldown_start: 0,
    })
}

pub fn get_verifier_record(env: &Env, id: u64) -> Result<VerifierRecord, Error> {
    let verifiers = get_all_verifiers_map(env);
    verifiers.get(id).ok_or(Error::VerifierNotFound)
}

pub fn get_verifier_by_address(env: &Env, address: &Address) -> Result<VerifierRecord, Error> {
    let id = resolve_verifier_id(env, address)?;
    get_verifier_record(env, id)
}

pub fn get_all_verifiers(env: &Env) -> soroban_sdk::Vec<VerifierRecord> {
    let verifiers = get_all_verifiers_map(env);
    let mut result = soroban_sdk::Vec::new(env);
    for (_, record) in verifiers.iter() {
        result.push_back(record);
    }
    result
}

pub fn update_last_active(env: &Env, verifier_id: u64) -> Result<(), Error> {
    let mut verifiers = get_all_verifiers_map(env);
    let mut record = verifiers.get(verifier_id).ok_or(Error::VerifierNotFound)?;
    record.last_active = env.ledger().timestamp();
    verifiers.set(verifier_id, record);
    set_verifiers(env, &verifiers);
    Ok(())
}

pub fn suspend_verifier(env: &Env, verifier_id: u64) -> Result<(), Error> {
    let mut verifiers = get_all_verifiers_map(env);
    let mut record = verifiers.get(verifier_id).ok_or(Error::VerifierNotFound)?;
    record.status = VerifierStatus::Suspended;
    verifiers.set(verifier_id, record);
    set_verifiers(env, &verifiers);

    env.events().publish(
        (soroban_sdk::Symbol::new(env, "verifier_suspended"),),
        (verifier_id,),
    );

    Ok(())
}

pub fn slash_verifier(env: &Env, verifier_id: u64, amount: i128) -> Result<(), Error> {
    let mut verifiers = get_all_verifiers_map(env);
    let mut record = verifiers.get(verifier_id).ok_or(Error::VerifierNotFound)?;
    record.status = VerifierStatus::Slashed;
    verifiers.set(verifier_id, record);
    set_verifiers(env, &verifiers);

    let mut stakes = get_all_stakes_map(env);
    let mut stake = stakes.get(verifier_id).unwrap_or(StakeRecord {
        amount: 0,
        locked_until: 0,
        withdrawal_requested_at: 0,
        cooldown_start: 0,
    });

    if amount > 0 && amount <= stake.amount {
        stake.amount -= amount;
        stakes.set(verifier_id, stake);
        set_stakes(env, &stakes);
    }

    env.events().publish(
        (soroban_sdk::Symbol::new(env, "verifier_slashed"),),
        (verifier_id, amount),
    );

    Ok(())
}

pub fn resolve_verifier_id(env: &Env, address: &Address) -> Result<u64, Error> {
    let by_address = get_verifier_by_address_map(env);
    by_address.get(address.clone()).ok_or(Error::VerifierNotFound)
}

// --- Storage helpers ---

fn next_verifier_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&"next_verifier_id")
        .unwrap_or(1u64)
}

fn set_next_verifier_id(env: &Env, id: u64) {
    env.storage().instance().set(&"next_verifier_id", &id);
}

fn get_all_verifiers_map(env: &Env) -> Map<u64, VerifierRecord> {
    env.storage()
        .instance()
        .get(&"verifiers")
        .unwrap_or(Map::new(env))
}

fn set_verifiers(env: &Env, map: &Map<u64, VerifierRecord>) {
    env.storage().instance().set(&"verifiers", map);
}

fn get_all_stakes_map(env: &Env) -> Map<u64, StakeRecord> {
    env.storage()
        .instance()
        .get(&"stakes")
        .unwrap_or(Map::new(env))
}

fn set_stakes(env: &Env, map: &Map<u64, StakeRecord>) {
    env.storage().instance().set(&"stakes", map);
}

fn get_verifier_by_address_map(env: &Env) -> Map<Address, u64> {
    env.storage()
        .instance()
        .get(&"verifier_by_address")
        .unwrap_or(Map::new(env))
}

fn set_verifier_by_address(env: &Env, map: &Map<Address, u64>) {
    env.storage().instance().set(&"verifier_by_address", map);
}
