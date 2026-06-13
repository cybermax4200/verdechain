export interface EmissionFactor {
  value: number;
  unit: string;
  source: string;
  year: number;
}

export interface FactorCategory {
  [key: string]: EmissionFactor;
}

const FUEL_FACTORS: FactorCategory = {
  natural_gas: { value: 0.20196, unit: 'kgCO2e/kWh', source: 'IPCC 2024', year: 2024 },
  diesel: { value: 0.26676, unit: 'kgCO2e/kWh', source: 'IPCC 2024', year: 2024 },
  gasoline: { value: 0.24768, unit: 'kgCO2e/kWh', source: 'IPCC 2024', year: 2024 },
  coal: { value: 0.33828, unit: 'kgCO2e/kWh', source: 'IPCC 2024', year: 2024 },
  biomass: { value: 0.09720, unit: 'kgCO2e/kWh', source: 'IPCC 2024', year: 2024 },
  jet_fuel: { value: 0.25920, unit: 'kgCO2e/kWh', source: 'IPCC 2024', year: 2024 },
  propane: { value: 0.21492, unit: 'kgCO2e/kWh', source: 'IPCC 2024', year: 2024 },
  heavy_fuel_oil: { value: 0.27972, unit: 'kgCO2e/kWh', source: 'IPCC 2024', year: 2024 },
  lignite: { value: 0.36468, unit: 'kgCO2e/kWh', source: 'IPCC 2024', year: 2024 },
  petroleum_coke: { value: 0.33948, unit: 'kgCO2e/kWh', source: 'IPCC 2024', year: 2024 },
};

const GRID_FACTORS: FactorCategory = {
  global_avg: { value: 0.475, unit: 'kgCO2e/kWh', source: 'IPCC 2024', year: 2024 },
  oecd: { value: 0.365, unit: 'kgCO2e/kWh', source: 'IPCC 2024', year: 2024 },
  non_oecd: { value: 0.585, unit: 'kgCO2e/kWh', source: 'IPCC 2024', year: 2024 },
  eu: { value: 0.251, unit: 'kgCO2e/kWh', source: 'IPCC 2024', year: 2024 },
};

const INDUSTRIAL_FACTORS: FactorCategory = {
  cement_clinker: { value: 0.525, unit: 'kgCO2e/kg', source: 'IPCC 2024', year: 2024 },
  steel_bof: { value: 2.330, unit: 'kgCO2e/kg', source: 'IPCC 2024', year: 2024 },
  steel_eaf: { value: 0.680, unit: 'kgCO2e/kg', source: 'IPCC 2024', year: 2024 },
  aluminum_smelting: { value: 1.670, unit: 'kgCO2e/kg', source: 'IPCC 2024', year: 2024 },
  ammonia: { value: 1.618, unit: 'kgCO2e/kg', source: 'IPCC 2024', year: 2024 },
  hydrogen_smr: { value: 9.300, unit: 'kgCO2e/kg', source: 'IPCC 2024', year: 2024 },
  hydrogen_electrolysis: { value: 0.500, unit: 'kgCO2e/kg', source: 'IPCC 2024', year: 2024 },
  glass_manufacturing: { value: 0.560, unit: 'kgCO2e/kg', source: 'IPCC 2024', year: 2024 },
  lime_production: { value: 0.750, unit: 'kgCO2e/kg', source: 'IPCC 2024', year: 2024 },
  nitric_acid: { value: 3.000, unit: 'kgCO2e/kg', source: 'IPCC 2024', year: 2024 },
};

const TRANSPORT_FACTORS: FactorCategory = {
  road_freight_diesel: { value: 0.162, unit: 'kgCO2e/tkm', source: 'IPCC 2024', year: 2024 },
  road_freight_electric: { value: 0.048, unit: 'kgCO2e/tkm', source: 'IPCC 2024', year: 2024 },
  rail_freight: { value: 0.021, unit: 'kgCO2e/tkm', source: 'IPCC 2024', year: 2024 },
  maritime_container: { value: 0.010, unit: 'kgCO2e/tkm', source: 'IPCC 2024', year: 2024 },
  maritime_bulk: { value: 0.008, unit: 'kgCO2e/tkm', source: 'IPCC 2024', year: 2024 },
  air_freight_short: { value: 1.170, unit: 'kgCO2e/tkm', source: 'IPCC 2024', year: 2024 },
  air_freight_long: { value: 0.570, unit: 'kgCO2e/tkm', source: 'IPCC 2024', year: 2024 },
  inland_shipping: { value: 0.031, unit: 'kgCO2e/tkm', source: 'IPCC 2024', year: 2024 },
  pipeline: { value: 0.005, unit: 'kgCO2e/tkm', source: 'IPCC 2024', year: 2024 },
};

const WASTE_FACTORS: FactorCategory = {
  landfill_mixed: { value: 0.589, unit: 'kgCO2e/kg', source: 'IPCC 2024', year: 2024 },
  recycling_mixed: { value: 0.021, unit: 'kgCO2e/kg', source: 'IPCC 2024', year: 2024 },
  incineration: { value: 0.412, unit: 'kgCO2e/kg', source: 'IPCC 2024', year: 2024 },
  composting: { value: 0.153, unit: 'kgCO2e/kg', source: 'IPCC 2024', year: 2024 },
  anaerobic_digestion: { value: 0.089, unit: 'kgCO2e/kg', source: 'IPCC 2024', year: 2024 },
};

export class IpccFactors {
  static getFuelFactor(fuelType: string): EmissionFactor | undefined {
    return FUEL_FACTORS[fuelType];
  }

  static getAllFuelFactors(): FactorCategory {
    return { ...FUEL_FACTORS };
  }

  static getGridFactor(region: string): EmissionFactor | undefined {
    return GRID_FACTORS[region];
  }

  static getAllGridFactors(): FactorCategory {
    return { ...GRID_FACTORS };
  }

  static getIndustrialFactor(process: string): EmissionFactor | undefined {
    return INDUSTRIAL_FACTORS[process];
  }

  static getAllIndustrialFactors(): FactorCategory {
    return { ...INDUSTRIAL_FACTORS };
  }

  static getTransportFactor(mode: string): EmissionFactor | undefined {
    return TRANSPORT_FACTORS[mode];
  }

  static getAllTransportFactors(): FactorCategory {
    return { ...TRANSPORT_FACTORS };
  }

  static getWasteFactor(method: string): EmissionFactor | undefined {
    return WASTE_FACTORS[method];
  }

  static getAllWasteFactors(): FactorCategory {
    return { ...WASTE_FACTORS };
  }

  static getAll(): Record<string, FactorCategory> {
    return {
      fuels: FUEL_FACTORS,
      grid: GRID_FACTORS,
      industrial: INDUSTRIAL_FACTORS,
      transport: TRANSPORT_FACTORS,
      waste: WASTE_FACTORS,
    };
  }
}
