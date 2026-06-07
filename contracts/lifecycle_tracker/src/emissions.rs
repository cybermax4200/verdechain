use soroban_sdk::Env;

use shared::errors::Error;

use crate::types::LifecycleStage;

use crate::storage::LifecycleStore;

const EMISSION_FACTOR_ENERGY: i128 = 475;
const EMISSION_FACTOR_FUEL: i128 = 2_680;
const EMISSION_FACTOR_WASTE: i128 = 700;

const STAGE_ENERGY_FACTORS: [(LifecycleStage, i128); 8] = [
    (LifecycleStage::RawMaterialExtraction, 1_200),
    (LifecycleStage::Transportation, 800),
    (LifecycleStage::Manufacturing, 2_500),
    (LifecycleStage::Packaging, 500),
    (LifecycleStage::Distribution, 600),
    (LifecycleStage::Retail, 300),
    (LifecycleStage::Use, 4_000),
    (LifecycleStage::EndOfLife, 900),
];

pub fn compute_emissions(
    env: &Env,
    stage: &LifecycleStage,
    energy_used: i128,
    fuel_used: i128,
    waste_generated: i128,
) -> i128 {
    let oracle_address = LifecycleStore::carbon_oracle(env);

    if let Some(_oracle_addr) = oracle_address {
        call_oracle_for_factors(env, stage, energy_used, fuel_used, waste_generated)
    } else {
        compute_fallback(stage, energy_used, fuel_used, waste_generated)
    }
}

fn compute_fallback(
    stage: &LifecycleStage,
    energy_used: i128,
    fuel_used: i128,
    waste_generated: i128,
) -> i128 {
    let energy_emissions = energy_used * EMISSION_FACTOR_ENERGY / 1000;
    let fuel_emissions = fuel_used * EMISSION_FACTOR_FUEL / 1000;
    let waste_emissions = waste_generated * EMISSION_FACTOR_WASTE / 1000;

    let stage_intensity = stage_factor(stage);
    let stage_multiplier = 1000 + stage_intensity;

    (energy_emissions + fuel_emissions + waste_emissions) * stage_multiplier / 1000
}

fn call_oracle_for_factors(
    _env: &Env,
    stage: &LifecycleStage,
    energy_used: i128,
    fuel_used: i128,
    waste_generated: i128,
) -> i128 {
    compute_fallback(stage, energy_used, fuel_used, waste_generated)
}

fn stage_factor(stage: &LifecycleStage) -> i128 {
    for (s, factor) in STAGE_ENERGY_FACTORS.iter() {
        if s == stage {
            return *factor;
        }
    }
    1000
}

pub fn get_emissions_breakdown(
    env: &Env,
    product_id: u64,
) -> Result<(i128, i128, i128, i128), Error> {
    let events = LifecycleStore::events_for_product(env, product_id);
    let mut total_emissions: i128 = 0;
    let mut energy_emissions: i128 = 0;
    let mut fuel_emissions: i128 = 0;
    let mut waste_emissions: i128 = 0;

    for event in events.iter() {
        let e = event.emissions;
        total_emissions += e;
        energy_emissions += event.energy_used * EMISSION_FACTOR_ENERGY / 1000;
        fuel_emissions += event.fuel_used * EMISSION_FACTOR_FUEL / 1000;
        waste_emissions += event.waste_generated * EMISSION_FACTOR_WASTE / 1000;
    }

    Ok((total_emissions, energy_emissions, fuel_emissions, waste_emissions))
}
