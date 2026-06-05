use soroban_sdk::{Address, Env, String, Symbol};

pub fn product_registered(env: &Env, product_id: u64, manufacturer: &Address, ipfs_hash: &String) {
    env.events().publish(
        (Symbol::new(env, "product_registered"),),
        (product_id, manufacturer.clone(), ipfs_hash.clone()),
    );
}

pub fn product_transferred(
    env: &Env,
    product_id: u64,
    from: &Address,
    to: &Address,
    timestamp: u64,
) {
    env.events().publish(
        (Symbol::new(env, "product_transferred"),),
        (product_id, from.clone(), to.clone(), timestamp),
    );
}

pub fn product_recalled(env: &Env, product_id: u64, reason: &String, timestamp: u64) {
    env.events().publish(
        (Symbol::new(env, "product_recalled"),),
        (product_id, reason.clone(), timestamp),
    );
}
