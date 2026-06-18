# CarbonOracle Contract

## Overview

The CarbonOracle contract serves as the authoritative source of emission factors and grid intensity data on-chain. It supports multiple methodology versions (GHG Protocol, IPCC, EPA) and provides regional grid intensity lookups.

## Data Structures

### EmissionFactor

```rust
pub struct EmissionFactor {
    pub factor_type: String,
    pub value: i128,
    pub unit: String,
    pub source: String,
    pub methodology: String,
    pub valid_from: u64,
    pub valid_until: u64,
}
```

### GridIntensity

```rust
pub struct GridIntensity {
    pub region: String,
    pub intensity: i128,
    pub unit: String,
    pub year: u32,
}
```

## Entry Points

### update_emission_factor

Updates or adds an emission factor.

| Parameter | Type             | Description                                 |
| --------- | ---------------- | ------------------------------------------- |
| `key`     | `String`         | Factor identifier (e.g., `natural_gas.co2`) |
| `factor`  | `EmissionFactor` | Emission factor data                        |

**Auth:** Admin only

### get_emission_factor

Retrieves an emission factor by key.

### update_grid_intensity

Updates grid intensity for a region.

| Parameter   | Type     | Description                 |
| ----------- | -------- | --------------------------- |
| `region`    | `String` | ISO country/region code     |
| `intensity` | `i128`   | Grid intensity in gCO₂e/kWh |

**Auth:** Admin only

### get_grid_intensity

Returns grid intensity for a region.

### get_methodology_version

Returns the current methodology version string.

### set_methodology

Sets the active methodology version.

| Parameter     | Type     | Description            |
| ------------- | -------- | ---------------------- |
| `methodology` | `String` | Methodology identifier |

**Supported methodologies:** `GHG Protocol 2024`, `IPCC 2024`, `EPA 2024`

## Emission Factors

The oracle maintains factors for:

- **Fuel combustion**: natural_gas, diesel, gasoline, coal, propane, biogas
- **Industrial processes**: cement_clinker, steel_bof, steel_eaf, ammonia, aluminum
- **Grid intensity**: 40+ country/region entries
- **Transport**: road_freight, air_freight, sea_freight, rail_freight
- **Waste**: landfill, incineration, composting, recycling

## Error Codes

| Code | Error                | Description                             |
| ---- | -------------------- | --------------------------------------- |
| 500  | `NotAuthorized`      | Admin-only operation                    |
| 501  | `FactorNotFound`     | Emission factor not found               |
| 502  | `InvalidFactor`      | Factor data is invalid                  |
| 503  | `RegionNotFound`     | Grid intensity not available for region |
| 504  | `InvalidMethodology` | Methodology version not recognized      |

## Testing

```bash
cargo test -p carbon_oracle
```
