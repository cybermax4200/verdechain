use soroban_sdk::{vec, Address, Env, IntoVal, String, Symbol};

use shared::errors::Error;

use crate::storage::LifecycleStore;
use crate::types::LifecycleStage;

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

    if let Some(oracle_addr) = oracle_address {
        call_oracle_for_factors(
            env,
            &oracle_addr,
            stage,
            energy_used,
            fuel_used,
            waste_generated,
        )
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
    env: &Env,
    oracle_id: &Address,
    stage: &LifecycleStage,
    energy_used: i128,
    fuel_used: i128,
    waste_generated: i128,
) -> i128 {
    let energy_key = stage_activity_key(env, stage, "energy");
    let fuel_key = stage_activity_key(env, stage, "fuel");
    let waste_key = stage_activity_key(env, stage, "waste");

    let energy_factor =
        oracle_factor_value(env, oracle_id, &energy_key).unwrap_or(EMISSION_FACTOR_ENERGY);
    let fuel_factor =
        oracle_factor_value(env, oracle_id, &fuel_key).unwrap_or(EMISSION_FACTOR_FUEL);
    let waste_factor =
        oracle_factor_value(env, oracle_id, &waste_key).unwrap_or(EMISSION_FACTOR_WASTE);

    let region = String::from_str(env, "global");
    let grid_intensity = oracle_grid_intensity(env, oracle_id, &region);

    let grid_mult = if grid_intensity > 0 {
        1000 + grid_intensity
    } else {
        1000 + stage_factor(stage)
    };

    let energy_emissions = energy_used * energy_factor / 1000;
    let fuel_emissions = fuel_used * fuel_factor / 1000;
    let waste_emissions = waste_generated * waste_factor / 1000;

    (energy_emissions + fuel_emissions + waste_emissions) * grid_mult / 1000
}

fn oracle_factor_value(
    env: &Env,
    oracle_id: &Address,
    activity_type: &String,
) -> Option<i128> {
    let args = vec![env, activity_type.clone().into_val(env)];
    let result: i128 = env.invoke_contract(
        oracle_id,
        &Symbol::new(env, "get_emission_factor_value"),
        args,
    );
    let value = result;
    if value > 0 {
        Some(value)
    } else {
        None
    }
}

fn oracle_grid_intensity(env: &Env, oracle_id: &Address, region: &String) -> i128 {
    let args = vec![env, region.clone().into_val(env)];
    env.invoke_contract::<i128>(
        oracle_id,
        &Symbol::new(env, "get_grid_intensity"),
        args,
    )
}

fn stage_activity_key(env: &Env, stage: &LifecycleStage, suffix: &str) -> String {
    let key = match (stage, suffix) {
        (LifecycleStage::RawMaterialExtraction, "energy") => "raw_material_energy",
        (LifecycleStage::RawMaterialExtraction, "fuel") => "raw_material_fuel",
        (LifecycleStage::RawMaterialExtraction, "waste") => "raw_material_waste",
        (LifecycleStage::Transportation, "energy") => "transport_energy",
        (LifecycleStage::Transportation, "fuel") => "transport_fuel",
        (LifecycleStage::Transportation, "waste") => "transport_waste",
        (LifecycleStage::Manufacturing, "energy") => "manufacturing_energy",
        (LifecycleStage::Manufacturing, "fuel") => "manufacturing_fuel",
        (LifecycleStage::Manufacturing, "waste") => "manufacturing_waste",
        (LifecycleStage::Packaging, "energy") => "packaging_energy",
        (LifecycleStage::Packaging, "fuel") => "packaging_fuel",
        (LifecycleStage::Packaging, "waste") => "packaging_waste",
        (LifecycleStage::Distribution, "energy") => "distribution_energy",
        (LifecycleStage::Distribution, "fuel") => "distribution_fuel",
        (LifecycleStage::Distribution, "waste") => "distribution_waste",
        (LifecycleStage::Retail, "energy") => "retail_energy",
        (LifecycleStage::Retail, "fuel") => "retail_fuel",
        (LifecycleStage::Retail, "waste") => "retail_waste",
        (LifecycleStage::Use, "energy") => "use_phase_energy",
        (LifecycleStage::Use, "fuel") => "use_phase_fuel",
        (LifecycleStage::Use, "waste") => "use_phase_waste",
        (LifecycleStage::EndOfLife, "energy") => "end_of_life_energy",
        (LifecycleStage::EndOfLife, "fuel") => "end_of_life_fuel",
        (LifecycleStage::EndOfLife, "waste") => "end_of_life_waste",
        _ => "unknown",
    };
    String::from_str(env, key)
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
