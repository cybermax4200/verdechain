use soroban_sdk::{Address, Env, Vec};

pub const BASE_QUORUM: u32 = 3;
pub const ESCALATED_QUORUM: u32 = 5;

pub fn needs_escalation(approvals: &Vec<Address>, current_quorum: u32) -> bool {
    let approval_count: u32 = approvals.len();
    approval_count < current_quorum
}

pub fn escalate_verifiers(
    env: &Env,
    current_verifiers: &Vec<Address>,
    available_verifiers: &Vec<Address>,
) -> Vec<Address> {
    let mut expanded = Vec::new(env);
    for v in current_verifiers.iter() {
        expanded.push_back(v);
    }
    for v in available_verifiers.iter() {
        if expanded.len() >= ESCALATED_QUORUM {
            break;
        }
        if !contains(&expanded, &v) {
            expanded.push_back(v);
        }
    }
    expanded
}

fn contains(verifiers: &Vec<Address>, addr: &Address) -> bool {
    for v in verifiers.iter() {
        if v == *addr {
            return true;
        }
    }
    false
}
