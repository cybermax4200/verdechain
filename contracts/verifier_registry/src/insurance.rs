use soroban_sdk::Env;

use crate::types::InsurancePool;

pub fn get_pool_balance(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&"insurance_pool")
        .unwrap_or(InsurancePool {
            total_balance: 0,
            total_premiums_collected: 0,
            total_payouts: 0,
            active_policies: 0,
        })
        .total_balance
}

pub fn get_pool_details(env: &Env) -> InsurancePool {
    env.storage()
        .instance()
        .get(&"insurance_pool")
        .unwrap_or(InsurancePool {
            total_balance: 0,
            total_premiums_collected: 0,
            total_payouts: 0,
            active_policies: 0,
        })
}

pub fn contribute_to_pool(env: &Env, amount: i128) {
    let mut pool: InsurancePool = env
        .storage()
        .instance()
        .get(&"insurance_pool")
        .unwrap_or(InsurancePool {
            total_balance: 0,
            total_premiums_collected: 0,
            total_payouts: 0,
            active_policies: 0,
        });

    pool.total_balance += amount;
    pool.total_premiums_collected += amount;
    env.storage()
        .instance()
        .set(&"insurance_pool", &pool);
}

pub fn claim_from_pool(env: &Env, amount: i128) -> bool {
    let mut pool: InsurancePool = env
        .storage()
        .instance()
        .get(&"insurance_pool")
        .unwrap_or(InsurancePool {
            total_balance: 0,
            total_premiums_collected: 0,
            total_payouts: 0,
            active_policies: 0,
        });

    if pool.total_balance >= amount {
        pool.total_balance -= amount;
        pool.total_payouts += amount;
        env.storage()
            .instance()
            .set(&"insurance_pool", &pool);
        true
    } else {
        false
    }
}

pub fn update_active_policies(env: &Env, delta: i32) {
    let mut pool: InsurancePool = env
        .storage()
        .instance()
        .get(&"insurance_pool")
        .unwrap_or(InsurancePool {
            total_balance: 0,
            total_premiums_collected: 0,
            total_payouts: 0,
            active_policies: 0,
        });

    if delta > 0 {
        pool.active_policies += delta as u32;
    } else {
        let abs_delta = (-delta) as u32;
        if pool.active_policies >= abs_delta {
            pool.active_policies -= abs_delta;
        } else {
            pool.active_policies = 0;
        }
    }

    env.storage()
        .instance()
        .set(&"insurance_pool", &pool);
}
