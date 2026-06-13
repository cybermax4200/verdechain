import { EmissionFactor, FactorCategory } from './ipcc';

const US_GRID_FACTORS: FactorCategory = {
  npcc: { value: 0.282, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  mro: { value: 0.509, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  rfce: { value: 0.461, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  rfcm: { value: 0.338, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  srvc: { value: 0.371, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  srso: { value: 0.381, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  erct: { value: 0.221, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  nyme: { value: 0.267, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  nyli: { value: 0.498, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  nycw: { value: 0.282, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  pjmw: { value: 0.412, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  pjme: { value: 0.371, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  calm: { value: 0.206, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  caiso: { value: 0.234, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  aznm: { value: 0.454, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  nwpp: { value: 0.148, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  rmpa: { value: 0.591, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  spno: { value: 0.404, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  spso: { value: 0.412, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
};

const US_TRANSPORT_FACTORS: FactorCategory = {
  heavy_duty_diesel: { value: 0.178, unit: 'kgCO2e/km', source: 'EPA 2024', year: 2024 },
  heavy_duty_cng: { value: 0.147, unit: 'kgCO2e/km', source: 'EPA 2024', year: 2024 },
  medium_duty_diesel: { value: 0.112, unit: 'kgCO2e/km', source: 'EPA 2024', year: 2024 },
  medium_duty_electric: { value: 0.048, unit: 'kgCO2e/km', source: 'EPA 2024', year: 2024 },
  light_duty_gasoline: { value: 0.241, unit: 'kgCO2e/km', source: 'EPA 2024', year: 2024 },
  light_duty_electric: { value: 0.068, unit: 'kgCO2e/km', source: 'EPA 2024', year: 2024 },
  rail_freight: { value: 0.019, unit: 'kgCO2e/tkm', source: 'EPA 2024', year: 2024 },
  marine_diesel: { value: 0.013, unit: 'kgCO2e/tkm', source: 'EPA 2024', year: 2024 },
  aviation_gasoline: { value: 0.985, unit: 'kgCO2e/tkm', source: 'EPA 2024', year: 2024 },
};

const US_WASTE_FACTORS: FactorCategory = {
  landfill_msw: { value: 0.623, unit: 'kgCO2e/kg', source: 'EPA WARM 2024', year: 2024 },
  combustion_msw: { value: 0.456, unit: 'kgCO2e/kg', source: 'EPA WARM 2024', year: 2024 },
  recycling_aluminum: { value: -8.290, unit: 'kgCO2e/kg', source: 'EPA WARM 2024', year: 2024 },
  recycling_steel: { value: -1.420, unit: 'kgCO2e/kg', source: 'EPA WARM 2024', year: 2024 },
  recycling_glass: { value: -0.340, unit: 'kgCO2e/kg', source: 'EPA WARM 2024', year: 2024 },
  recycling_plastic: { value: -1.860, unit: 'kgCO2e/kg', source: 'EPA WARM 2024', year: 2024 },
  recycling_paper: { value: -0.980, unit: 'kgCO2e/kg', source: 'EPA WARM 2024', year: 2024 },
  composting_food: { value: 0.127, unit: 'kgCO2e/kg', source: 'EPA WARM 2024', year: 2024 },
  anaerobic_digestion: { value: 0.076, unit: 'kgCO2e/kg', source: 'EPA WARM 2024', year: 2024 },
};

export class EpaFactors {
  static getUsGridFactor(region: string): EmissionFactor | undefined {
    return US_GRID_FACTORS[region.toLowerCase()];
  }

  static getAllUsGridFactors(): FactorCategory {
    return { ...US_GRID_FACTORS };
  }

  static getTransportFactor(mode: string): EmissionFactor | undefined {
    return US_TRANSPORT_FACTORS[mode];
  }

  static getAllTransportFactors(): FactorCategory {
    return { ...US_TRANSPORT_FACTORS };
  }

  static getWasteFactor(method: string): EmissionFactor | undefined {
    return US_WASTE_FACTORS[method];
  }

  static getAllWasteFactors(): FactorCategory {
    return { ...US_WASTE_FACTORS };
  }

  static getAll(): Record<string, FactorCategory> {
    return {
      us_grid: US_GRID_FACTORS,
      transport: US_TRANSPORT_FACTORS,
      waste: US_WASTE_FACTORS,
    };
  }
}
