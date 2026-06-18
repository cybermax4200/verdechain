import { IpccFactors } from '../factors/ipcc';
import { LifecycleEventData } from '../methodology';

export interface DirectEmissionsResult {
  combustionEmissions: number;
  processEmissions: number;
  totalScope1: number;
  breakdown: {
    source: string;
    value: number;
    unit: string;
  }[];
}

export function calculateDirectEmissions(
  fuelUse: number,
  fuelType: string,
  unit: 'kWh' | 'kg' | 'liter' = 'kWh',
): number {
  const factor = IpccFactors.getFuelFactor(fuelType);
  if (!factor) {
    return 0;
  }

  let convertedAmount = fuelUse;
  if (unit === 'kg') {
    convertedAmount = fuelUse * 11.63;
  } else if (unit === 'liter') {
    convertedAmount = fuelUse * 9.96;
  }

  return convertedAmount * factor.value;
}

export function calculateProcessEmissions(
  chemicalInputs: { name: string; quantity: number; unit?: string }[],
): number {
  let totalProcess = 0;

  for (const input of chemicalInputs) {
    const factor = IpccFactors.getIndustrialFactor(input.name);
    if (factor) {
      totalProcess += input.quantity * factor.value;
    }
  }

  return totalProcess;
}

export function calculateScope1FromEvents(events: LifecycleEventData[]): DirectEmissionsResult {
  let combustionEmissions = 0;
  let processEmissions = 0;
  const breakdown: { source: string; value: number; unit: string }[] = [];

  for (const event of events) {
    if (event.fuelUsed !== undefined && event.fuelUsed !== null && event.fuelType) {
      const emissions = calculateDirectEmissions(event.fuelUsed, event.fuelType);
      if (emissions > 0) {
        combustionEmissions += emissions;
        breakdown.push({
          source: `fuel_${event.fuelType}`,
          value: emissions,
          unit: 'kgCO2e',
        });
      }
    }

    if (event.materialInputs && event.materialInputs.length > 0) {
      const processEmits = calculateProcessEmissions(
        event.materialInputs.map((m) => ({ name: m.name, quantity: m.quantity, unit: m.unit })),
      );
      if (processEmits > 0) {
        processEmissions += processEmits;
        breakdown.push({
          source: `process_${event.stage}`,
          value: processEmits,
          unit: 'kgCO2e',
        });
      }
    }
  }

  return {
    combustionEmissions: Math.round(combustionEmissions * 100) / 100,
    processEmissions: Math.round(processEmissions * 100) / 100,
    totalScope1: Math.round((combustionEmissions + processEmissions) * 100) / 100,
    breakdown,
  };
}
