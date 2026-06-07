use soroban_sdk::contracttype;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EmissionFactor {
    pub activity_type: soroban_sdk::String,
    pub factor_value: i128,
    pub unit: soroban_sdk::String,
    pub source: soroban_sdk::String,
    pub region: soroban_sdk::String,
}
