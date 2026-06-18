import { GridIntensityFactor } from '../factors/grid';
import { IpccFactors } from '../factors/ipcc';
import { LifecycleEventData } from '../methodology';

export interface EnergyEmissionsResult {
  purchasedElectricity: number;
  purchasedHeat: number;
  totalScope2: number;
  breakdown: {
    source: string;
    value: number;
    unit: string;
  }[];
}

export function calculateEnergyEmissions(kwh: number, gridIntensity: number): number {
  return kwh * gridIntensity;
}

export function getGridIntensityForRegion(region: string): number {
  const gridData = GridIntensityFactor.getIntensity(region);
  if (gridData) return gridData.value;

  const ipccGrid = IpccFactors.getGridFactor(region);
  if (ipccGrid) return ipccGrid.value;

  const globalAvg = IpccFactors.getGridFactor('global_avg');
  return globalAvg?.value ?? 0.475;
}

export function calculateScope2FromEvents(events: LifecycleEventData[]): EnergyEmissionsResult {
  let purchasedElectricity = 0;
  let purchasedHeat = 0;
  const breakdown: { source: string; value: number; unit: string }[] = [];

  for (const event of events) {
    if (event.energyKwh != null && event.energyKwh > 0) {
      const region = event.region || event.location || 'global_avg';
      const intensity = getGridIntensityForRegion(region);
      const emissions = calculateEnergyEmissions(event.energyKwh, intensity);

      purchasedElectricity += emissions;
      breakdown.push({
        source: `electricity_${event.stage}`,
        value: emissions,
        unit: 'kgCO2e',
      });
    }
  }

  return {
    purchasedElectricity: Math.round(purchasedElectricity * 100) / 100,
    purchasedHeat: Math.round(purchasedHeat * 100) / 100,
    totalScope2: Math.round((purchasedElectricity + purchasedHeat) * 100) / 100,
    breakdown,
  };
}
