use soroban_sdk::contracttype;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ProductStatus {
    Active,
    Recalled,
    Discontinued,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum LifecycleStage {
    RawMaterialExtraction,
    Transportation,
    Manufacturing,
    Packaging,
    Distribution,
    Retail,
    Use,
    EndOfLife,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EnergySource {
    Solar,
    Wind,
    Hydro,
    Nuclear,
    NaturalGas,
    Coal,
    Biomass,
    Geothermal,
    Grid,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum AttestationStatus {
    Pending,
    Approved,
    Rejected,
    Escalated,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CertType {
    CarbonNeutral,
    Organic,
    FairTrade,
    RecycledContent,
    EnergyStar,
    CradleToCradle,
    BCorp,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum VerifierStatus {
    Active,
    Suspended,
    Slashed,
    Inactive,
}
