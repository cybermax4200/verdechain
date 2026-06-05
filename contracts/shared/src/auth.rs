use soroban_sdk::{Address, Env};

use crate::errors::Error;

pub fn require_admin(env: &Env, admin: &Address) {
    if env.current_contract_address() != *admin {
        panic_if_not_admin(admin);
    }
}

fn panic_if_not_admin(admin: &Address) {
    admin.require_auth();
}

pub fn require_owner(_env: &Env, owner: &Address) {
    owner.require_auth();
}

pub fn check_owner(owner: &Address) -> Result<(), Error> {
    owner.require_auth();
    Ok(())
}

pub fn check_admin(admin: &Address, caller: &Address) -> Result<(), Error> {
    if admin != caller {
        return Err(Error::Unauthorized);
    }
    caller.require_auth();
    Ok(())
}
