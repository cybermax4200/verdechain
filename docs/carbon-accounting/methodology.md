# Carbon Accounting Methodology

## Overview

VerdeChain implements the **GHG Protocol Corporate Accounting and Reporting Standard** (Revised Edition) for calculating carbon footprints. Emissions are categorized into three scopes:

- **Scope 1**: Direct emissions from owned or controlled sources
- **Scope 2**: Indirect emissions from purchased energy
- **Scope 3**: All other indirect emissions in the value chain

## Scope Definitions

### Scope 1 — Direct Emissions

Calculated from lifecycle event data:

| Source | Calculation | Data Required |
|--------|-------------|---------------|
| Fuel combustion | `fuel_used × emission_factor` | Fuel type, quantity |
| Process emissions | `material_quantity × process_factor` | Material type, quantity |
| Fleet operations | `distance × fleet_factor` | Distance, vehicle type |

**Default emission factors (kg CO₂e per unit):**

| Fuel Type | Factor | Unit |
|-----------|--------|------|
| Natural gas | 0.20196 | kg CO₂e/kWh |
| Diesel | 0.26676 | kg CO₂e/kWh |
| Gasoline | 0.24966 | kg CO₂e/kWh |
| Coal | 0.34020 | kg CO₂e/kWh |

### Scope 2 — Energy Indirect

Calculated from purchased electricity data:

| Source | Calculation | Data Required |
|--------|-------------|---------------|
| Grid electricity | `kWh × grid_intensity` | kWh consumed, region |
| Purchased steam | `steam_used × steam_factor` | Steam quantity |

**Grid intensity values** are sourced from the CarbonOracle contract and vary by region:

| Region | Intensity (g CO₂e/kWh) |
|--------|------------------------|
| US (average) | 417 |
| EU (average) | 276 |
| China | 621 |
| India | 708 |
| Brazil | 104 |

### Scope 3 — Supply Chain

Calculated from supply chain activity data:

| Category | Source | Calculation |
|----------|--------|-------------|
| Upstream | Purchased goods | `material_weight × cradle_to_gate_factor` |
| Upstream | Transport | `distance × weight × transport_factor` |
| Downstream | Distribution | `distance × transport_factor` |
| Downstream | Use phase | `energy_consumption × lifetime × grid_factor` |
| Downstream | End-of-life | `waste_quantity × disposal_factor` |

## Confidence Scoring

Each footprint calculation includes a confidence score (0–100) based on:

- **Data completeness** (40%): Percentage of required fields populated
- **Data granularity** (25%): Specific vs. default emission factors
- **Primary data** (20%): Direct measurements vs. estimates
- **Temporal relevance** (15%): Recency of emission factors

## Methodology Versions

| Version | Source | Description |
|---------|--------|-------------|
| `ghg_protocol_2024` | GHG Protocol | Corporate Standard + Scope 2 Guidance |
| `ipcc_2024` | IPCC | IPCC Guidelines for National Inventories |
| `epa_2024` | US EPA | EPA Emission Factors Hub |

## Equivalents

For consumer-friendly reporting, CO₂e values are converted to equivalents:

| Equivalent | Conversion Factor |
|------------|-------------------|
| km driven | 1 kg CO₂e ≈ 4 km |
| Trees required | 1 tree ≈ 21 kg CO₂e/year |
| Smartphones charged | 1 phone ≈ 0.05 kg CO₂e |
| Homes powered | 1 home ≈ 7,500 kg CO₂e/year |
| Gallons of gas | 1 gallon ≈ 8.887 kg CO₂e |

## API Usage

```bash
# Get full footprint for product
curl http://localhost:3000/carbon/footprint/1

# Get breakdown by lifecycle stage
curl http://localhost:3000/carbon/breakdown/1

# Compare multiple products
curl http://localhost:3000/carbon/compare?ids=1,2,3

# List emission factors
curl http://localhost:3000/carbon/factors

# Get grid intensity for a region
curl http://localhost:3000/carbon/grid-intensity/us
```
