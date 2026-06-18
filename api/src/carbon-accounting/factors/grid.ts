export interface GridIntensity {
  value: number;
  unit: string;
  source: string;
  year: number;
  region: string;
}

const GRID_INTENSITIES: GridIntensity[] = [
  { region: 'global', value: 0.475, unit: 'kgCO2e/kWh', source: 'IEA 2024', year: 2024 },
  { region: 'eu', value: 0.251, unit: 'kgCO2e/kWh', source: 'EEA 2024', year: 2024 },
  { region: 'us', value: 0.387, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  { region: 'cn', value: 0.583, unit: 'kgCO2e/kWh', source: 'IEA 2024', year: 2024 },
  { region: 'in', value: 0.677, unit: 'kgCO2e/kWh', source: 'IEA 2024', year: 2024 },
  { region: 'jp', value: 0.442, unit: 'kgCO2e/kWh', source: 'IEA 2024', year: 2024 },
  { region: 'kr', value: 0.467, unit: 'kgCO2e/kWh', source: 'IEA 2024', year: 2024 },
  { region: 'de', value: 0.329, unit: 'kgCO2e/kWh', source: 'EEA 2024', year: 2024 },
  { region: 'fr', value: 0.052, unit: 'kgCO2e/kWh', source: 'EEA 2024', year: 2024 },
  { region: 'uk', value: 0.212, unit: 'kgCO2e/kWh', source: 'EEA 2024', year: 2024 },
  { region: 'ca', value: 0.13, unit: 'kgCO2e/kWh', source: 'NRC 2024', year: 2024 },
  { region: 'au', value: 0.507, unit: 'kgCO2e/kWh', source: 'AEMO 2024', year: 2024 },
  { region: 'br', value: 0.089, unit: 'kgCO2e/kWh', source: 'IEA 2024', year: 2024 },
  { region: 'ru', value: 0.347, unit: 'kgCO2e/kWh', source: 'IEA 2024', year: 2024 },
  { region: 'za', value: 0.914, unit: 'kgCO2e/kWh', source: 'IEA 2024', year: 2024 },
  { region: 'mx', value: 0.452, unit: 'kgCO2e/kWh', source: 'IEA 2024', year: 2024 },
  { region: 'id', value: 0.614, unit: 'kgCO2e/kWh', source: 'IEA 2024', year: 2024 },
  { region: 'vn', value: 0.489, unit: 'kgCO2e/kWh', source: 'IEA 2024', year: 2024 },
  { region: 'th', value: 0.528, unit: 'kgCO2e/kWh', source: 'IEA 2024', year: 2024 },
  { region: 'tr', value: 0.428, unit: 'kgCO2e/kWh', source: 'IEA 2024', year: 2024 },
  { region: 'sa', value: 0.691, unit: 'kgCO2e/kWh', source: 'IEA 2024', year: 2024 },
  { region: 'ng', value: 0.427, unit: 'kgCO2e/kWh', source: 'IEA 2024', year: 2024 },
  { region: 'eg', value: 0.484, unit: 'kgCO2e/kWh', source: 'IEA 2024', year: 2024 },
  { region: 'npcc', value: 0.282, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  { region: 'mro', value: 0.509, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  { region: 'rfce', value: 0.461, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  { region: 'srvc', value: 0.371, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  { region: 'erct', value: 0.221, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  { region: 'caiso', value: 0.234, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  { region: 'nwpp', value: 0.148, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  { region: 'spno', value: 0.404, unit: 'kgCO2e/kWh', source: 'EPA eGRID 2024', year: 2024 },
  { region: 'oecd', value: 0.365, unit: 'kgCO2e/kWh', source: 'IEA 2024', year: 2024 },
  { region: 'non_oecd', value: 0.585, unit: 'kgCO2e/kWh', source: 'IEA 2024', year: 2024 },
];

export class GridIntensityFactor {
  static getIntensity(region: string): GridIntensity | undefined {
    return GRID_INTENSITIES.find((g) => g.region.toLowerCase() === region.toLowerCase());
  }

  static getAll(): GridIntensity[] {
    return [...GRID_INTENSITIES];
  }

  static setIntensity(region: string, value: number, unit: string, source: string): GridIntensity {
    const existing = GRID_INTENSITIES.findIndex(
      (g) => g.region.toLowerCase() === region.toLowerCase(),
    );
    const entry: GridIntensity = { region, value, unit, source, year: 2024 };
    if (existing >= 0) {
      GRID_INTENSITIES[existing] = entry;
    } else {
      GRID_INTENSITIES.push(entry);
    }
    return entry;
  }
}
