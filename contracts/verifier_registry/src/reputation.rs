use soroban_sdk::{Address, Env, Map};

use shared::constants::REPUTATION_DECAY_INTERVAL;
use shared::errors::Error;

use crate::types::{ReputationScore, VerifierRecord};

// Weight constants for reputation scoring
const ACCURACY_WEIGHT: u32 = 40;
const TIMELINESS_WEIGHT: u32 = 20;
const VOLUME_WEIGHT: u32 = 15;
const PEER_REVIEW_WEIGHT: u32 = 15;
const LONGEVITY_WEIGHT: u32 = 10;

const MAX_REPUTATION: u32 = 100;

fn calculate_accuracy_score(
    total_attestations: u32,
    successful_attestations: u32,
) -> u32 {
    if total_attestations == 0 {
        return 0;
    }
    let pct = (successful_attestations as u64 * 100) / total_attestations as u64;
    pct.min(100) as u32
}

fn calculate_timeliness_score(
    env: &Env,
    record: &VerifierRecord,
    _address: &Address,
) -> u32 {
    let now = env.ledger().timestamp();
    let active_seconds = now.saturating_sub(record.registered_at);

    // If verifier has been active for less than a day, partial score
    let one_day: u64 = 86400;
    if active_seconds < one_day {
        return (active_seconds as u32 * 100) / one_day as u32;
    }

    // Check if verifier was active recently (within 7 days)
    let seven_days: u64 = 7 * 86400;
    let since_last_active = now.saturating_sub(record.last_active);
    if since_last_active > seven_days {
        return 20;
    }

    100
}

fn calculate_volume_score(total_attestations: u32) -> u32 {
    // Score based on number of attestations handled
    // Cap at 100 attestations for max score
    let cap = 100u32;
    if total_attestations >= cap {
        return 100;
    }
    (total_attestations * 100) / cap
}

fn calculate_peer_review_score(_env: &Env, _verifier: &Address) -> u32 {
    0
}

fn calculate_longevity_score(env: &Env, record: &VerifierRecord) -> u32 {
    let now = env.ledger().timestamp();
    let active_seconds = now.saturating_sub(record.registered_at);

    // Max score after 1 year (31536000 seconds)
    let one_year: u64 = 31536000;
    if active_seconds >= one_year {
        return 100;
    }
    (active_seconds as u32 * 100) / one_year as u32
}

fn apply_decay(
    env: &Env,
    score: &ReputationScore,
    _record: &VerifierRecord,
) -> ReputationScore {
    let now = env.ledger().timestamp();
    let since_last_update = now.saturating_sub(score.last_updated);

    if since_last_update < REPUTATION_DECAY_INTERVAL {
        return score.clone();
    }

    let decay_periods = since_last_update / REPUTATION_DECAY_INTERVAL;
    if decay_periods == 0 {
        return score.clone();
    }

    let mut decayed = score.clone();
    let decay_factor = 5u32; // 5% decay per period
    let total_decay = (decay_factor * decay_periods as u32).min(50);

    if decayed.overall_score > total_decay {
        decayed.overall_score -= total_decay;
    } else {
        decayed.overall_score = 0;
    }

    decayed.last_updated = now;
    decayed
}

pub fn compute_reputation(
    env: &Env,
    verifier_id: u64,
    verifier: &Address,
    record: &VerifierRecord,
    total_attestations: u32,
    successful_attestations: u32,
    failed_attestations: u32,
) -> ReputationScore {
    let accuracy = calculate_accuracy_score(total_attestations, successful_attestations);
    let timeliness = calculate_timeliness_score(env, record, verifier);
    let volume = calculate_volume_score(total_attestations);
    let peer_review = calculate_peer_review_score(env, verifier);
    let longevity = calculate_longevity_score(env, record);

    let overall = ((accuracy as u64 * ACCURACY_WEIGHT as u64)
        + (timeliness as u64 * TIMELINESS_WEIGHT as u64)
        + (volume as u64 * VOLUME_WEIGHT as u64)
        + (peer_review as u64 * PEER_REVIEW_WEIGHT as u64)
        + (longevity as u64 * LONGEVITY_WEIGHT as u64))
        / 100;

    ReputationScore {
        verifier_id,
        accuracy_score: accuracy,
        timeliness_score: timeliness,
        volume_score: volume,
        peer_review_score: peer_review,
        longevity_score: longevity,
        overall_score: overall.min(MAX_REPUTATION as u64) as u32,
        total_attestations,
        successful_attestations,
        failed_attestations,
        last_updated: env.ledger().timestamp(),
    }
}

pub fn get_or_compute_reputation(
    env: &Env,
    verifier_id: u64,
) -> Result<ReputationScore, Error> {
    let verifiers_map: Map<u64, VerifierRecord> = env
        .storage()
        .instance()
        .get(&"verifiers")
        .unwrap_or(Map::new(env));
    let record = verifiers_map.get(verifier_id).ok_or(Error::VerifierNotFound)?;

    let verifier = record.verifier.clone();

    // Try to load existing score
    let mut scores: Map<u64, ReputationScore> = env
        .storage()
        .instance()
        .get(&"reputation_scores")
        .unwrap_or(Map::new(env));

    if let Some(score) = scores.get(verifier_id) {
        let decayed = apply_decay(env, &score, &record);
        if decayed != score {
            scores.set(verifier_id, decayed.clone());
            env.storage().instance().set(&"reputation_scores", &scores);
        }
        return Ok(decayed);
    }

    let score = compute_reputation(env, verifier_id, &verifier, &record, 0, 0, 0);
    scores.set(verifier_id, score.clone());
    env.storage().instance().set(&"reputation_scores", &scores);
    Ok(score)
}

pub fn update_reputation(
    env: &Env,
    verifier_id: u64,
    attestation_successful: bool,
) -> Result<ReputationScore, Error> {
    let verifiers_map: Map<u64, VerifierRecord> = env
        .storage()
        .instance()
        .get(&"verifiers")
        .unwrap_or(Map::new(env));
    let record = verifiers_map.get(verifier_id).ok_or(Error::VerifierNotFound)?;
    let verifier = record.verifier.clone();

    let mut scores: Map<u64, ReputationScore> = env
        .storage()
        .instance()
        .get(&"reputation_scores")
        .unwrap_or(Map::new(env));

    let current = scores.get(verifier_id).unwrap_or(ReputationScore {
        verifier_id,
        accuracy_score: 0,
        timeliness_score: 0,
        volume_score: 0,
        peer_review_score: 0,
        longevity_score: 0,
        overall_score: 0,
        total_attestations: 0,
        successful_attestations: 0,
        failed_attestations: 0,
        last_updated: 0,
    });

    let new_total = current.total_attestations + 1;
    let new_successful = if attestation_successful {
        current.successful_attestations + 1
    } else {
        current.successful_attestations
    };
    let new_failed = if !attestation_successful {
        current.failed_attestations + 1
    } else {
        current.failed_attestations
    };

    let score = compute_reputation(
        env,
        verifier_id,
        &verifier,
        &record,
        new_total,
        new_successful,
        new_failed,
    );

    scores.set(verifier_id, score.clone());
    env.storage().instance().set(&"reputation_scores", &scores);
    Ok(score)
}

pub fn get_verifier_rankings(env: &Env) -> soroban_sdk::Vec<ReputationScore> {
    let scores: Map<u64, ReputationScore> = env
        .storage()
        .instance()
        .get(&"reputation_scores")
        .unwrap_or(Map::new(env));

    let mut result = soroban_sdk::Vec::new(env);
    for (_, score) in scores.iter() {
        result.push_back(score);
    }
    result
}
