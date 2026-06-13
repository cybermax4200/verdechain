import { IpccFactors } from '../factors/ipcc';
import { EpaFactors } from '../factors/epa';
import { LifecycleEventData } from '../methodology';

export interface SupplyChainEmissionsResult {
  upstreamEmissions: number;
  downstreamEmissions: number;
  totalScope3: number;
  breakdown: {
    source: string;
    value: number;
    unit: string;
  }[];
}

export function calculateUpstreamEmissions(
  materials: { name: string; quantity: number; unit: string }[],
  transport: { mode?: string; distanceKm?: number; massKg?: number }[],
): number {
  let total = 0;

  for (const material of materials) {
    const factor = IpccFactors.getIndustrialFactor(material.name);
    if (factor) {
      total += material.quantity * factor.value;
    }
  }

  for (const leg of transport) {
    if (leg.mode && leg.distanceKm && leg.massKg) {
      const factor =
        IpccFactors.getTransportFactor(leg.mode) ||
        EpaFactors.getTransportFactor(leg.mode);
      if (factor) {
        total += (leg.distanceKm * leg.massKg / 1000) * factor.value;
      }
    }
  }

  return total;
}

export function calculateDownstreamEmissions(
  distribution: { mode?: string; distanceKm?: number; massKg?: number }[],
  usePhase: { energyKwh?: number; gridIntensity?: number },
  disposal: { wasteKg?: number; method?: string }[],
): number {
  let total = 0;

  for (const leg of distribution) {
    if (leg.mode && leg.distanceKm && leg.massKg) {
      const factor =
        IpccFactors.getTransportFactor(leg.mode) ||
        EpaFactors.getTransportFactor(leg.mode);
      if (factor) {
        total += (leg.distanceKm * leg.massKg / 1000) * factor.value;
      }
    }
  }

  if (usePhase.energyKwh && usePhase.gridIntensity) {
    total += usePhase.energyKwh * usePhase.gridIntensity;
  }

  for (const item of disposal) {
    if (item.wasteKg && item.method) {
      const factor =
        IpccFactors.getWasteFactor(item.method) ||
        EpaFactors.getWasteFactor(item.method);
      if (factor) {
        total += item.wasteKg * factor.value;
      }
    }
  }

  return total;
}

export function calculateScope3FromEvents(events: LifecycleEventData[]): SupplyChainEmissionsResult {
  const upstreamEvents = events.filter((e) => {
    const stage = e.stage;
    return stage === 'RAW_MATERIAL_EXTRACTION' || stage === 'TRANSPORT_TO_SUPPLIER';
  });

  const downstreamEvents = events.filter((e) => {
    const stage = e.stage;
    return stage === 'DISTRIBUTION' || stage === 'RETAIL' || stage === 'USE' || stage === 'END_OF_LIFE';
  });

  const breakdown: { source: string; value: number; unit: string }[] = [];
  let upstreamEmissions = 0;
  let downstreamEmissions = 0;

  for (const event of upstreamEvents) {
    if (event.materialInputs && event.materialInputs.length > 0) {
      const materials = event.materialInputs.map((m) => ({
        name: m.name,
        quantity: m.quantity,
        unit: m.unit,
      }));
      const transport = event.transportMode
        ? [{ mode: event.transportMode, distanceKm: event.distanceKm || 0, massKg: 1000 }]
        : [];
      const emissions = calculateUpstreamEmissions(materials, transport);
      upstreamEmissions += emissions;
      breakdown.push({
        source: `upstream_${event.stage}`,
        value: emissions,
        unit: 'kgCO2e',
      });
    }
  }

  for (const event of downstreamEvents) {
    const distribution = event.transportMode
      ? [{ mode: event.transportMode, distanceKm: event.distanceKm || 0, massKg: 1000 }]
      : [];
    const usePhase = { energyKwh: event.energyKwh || 0, gridIntensity: 0.475 };
    const disposal = event.wasteKg != null
      ? [{ wasteKg: event.wasteKg, method: 'landfill_mixed' }]
      : [];

    const emissions = calculateDownstreamEmissions(distribution, usePhase, disposal);
    downstreamEmissions += emissions;
    breakdown.push({
      source: `downstream_${event.stage}`,
      value: emissions,
      unit: 'kgCO2e',
    });
  }

  return {
    upstreamEmissions: Math.round(upstreamEmissions * 100) / 100,
    downstreamEmissions: Math.round(downstreamEmissions * 100) / 100,
    totalScope3: Math.round((upstreamEmissions + downstreamEmissions) * 100) / 100,
    breakdown,
  };
}
