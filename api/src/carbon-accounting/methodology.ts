import { IpccFactors, EmissionFactor } from './factors/ipcc';
import { EpaFactors } from './factors/epa';
import { GridIntensityFactor } from './factors/grid';

export interface LifecycleEventData {
  stage: string;
  energyKwh?: number | null;
  fuelUsed?: number | null;
  fuelType?: string | null;
  wasteKg?: number | null;
  materialInputs?: { name: string; quantity: number; unit: string }[];
  transportMode?: string;
  distanceKm?: number;
  region?: string;
  location?: string;
}

export type MethodologyVersion = 'ghg_protocol_2024' | 'ipcc_2024' | 'epa_2024';

export interface ScopeMapping {
  scope: 1 | 2 | 3;
  category: string;
}

const STAGE_SCOPE_MAPPINGS: Record<string, ScopeMapping> = {
  RAW_MATERIAL_EXTRACTION: { scope: 3, category: 'upstream' },
  TRANSPORT_TO_SUPPLIER: { scope: 3, category: 'upstream' },
  MANUFACTURING: { scope: 1, category: 'direct' },
  TRANSPORT_TO_DISTRIBUTOR: { scope: 3, category: 'upstream' },
  DISTRIBUTION: { scope: 3, category: 'downstream' },
  RETAIL: { scope: 2, category: 'energy_indirect' },
  USE: { scope: 3, category: 'downstream' },
  END_OF_LIFE: { scope: 3, category: 'downstream' },
};

export function getScopeMapping(stage: string): ScopeMapping {
  return STAGE_SCOPE_MAPPINGS[stage] || { scope: 3, category: 'upstream' };
}

export function getApplicableFactors(
  event: LifecycleEventData,
  _region?: string,
): { fuelFactor?: EmissionFactor; gridFactor?: EmissionFactor; transportFactor?: EmissionFactor } {
  const result: {
    fuelFactor?: EmissionFactor;
    gridFactor?: EmissionFactor;
    transportFactor?: EmissionFactor;
  } = {};

  const region = event.region || event.location || _region || 'global_avg';

  if (event.fuelType) {
    result.fuelFactor = IpccFactors.getFuelFactor(event.fuelType);
  }

  result.gridFactor = GridIntensityFactor.getIntensity(region) ||
    IpccFactors.getGridFactor(region) ||
    IpccFactors.getGridFactor('global_avg');

  if (event.transportMode) {
    result.transportFactor = IpccFactors.getTransportFactor(event.transportMode) ||
      EpaFactors.getTransportFactor(event.transportMode);
  }

  return result;
}

export function computeConfidence(events: LifecycleEventData[]): number {
  if (!events || events.length === 0) return 0;

  const weights = {
    hasEnergyData: 0.25,
    hasFuelData: 0.20,
    hasMaterialData: 0.20,
    hasTransportData: 0.15,
    hasWasteData: 0.10,
    hasRegionData: 0.10,
  };

  let score = 0;

  for (const event of events) {
    let eventScore = 0;

    if (event.energyKwh != null) eventScore += weights.hasEnergyData;
    if (event.fuelUsed != null && event.fuelType) eventScore += weights.hasFuelData;
    if (event.materialInputs && event.materialInputs.length > 0) eventScore += weights.hasMaterialData;
    if (event.transportMode && event.distanceKm != null) eventScore += weights.hasTransportData;
    if (event.wasteKg != null) eventScore += weights.hasWasteData;
    if (event.region || event.location) eventScore += weights.hasRegionData;

    score += eventScore;
  }

  const rawConfidence = (score / events.length) * 100;
  return Math.min(Math.round(rawConfidence), 100);
}
