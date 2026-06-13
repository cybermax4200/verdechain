import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateScope1FromEvents } from './calculators/scope1';
import { calculateScope2FromEvents } from './calculators/scope2';
import { calculateScope3FromEvents } from './calculators/scope3';
import {
  LifecycleEventData,
  getScopeMapping,
  computeConfidence,
  MethodologyVersion,
} from './methodology';
import { IpccFactors } from './factors/ipcc';
import { EpaFactors } from './factors/epa';
import { GridIntensityFactor } from './factors/grid';
export interface CarbonFootprintResult {
  productId: string;
  scope1: number;
  scope2: number;
  scope3: number;
  totalFootprint: number;
  confidenceScore: number;
  methodology: string;
  breakdown: {
    byScope: {
      scope1: { total: number; details: { source: string; value: number }[] };
      scope2: { total: number; details: { source: string; value: number }[] };
      scope3: { total: number; details: { source: string; value: number }[] };
    };
    byStage: { stage: string; scope: number; value: number }[];
  };
  equivalents: Equivalents;
  calculatedAt: string;
}

export interface Equivalents {
  kmDriven: number;
  treesRequired: number;
  smartphonesCharged: number;
  homesEnergyYear: number;
  gallonsGasoline: number;
}

const EQUIVALENTS = {
  kmDrivenPerKg: 0.248,
  treesPerKg: 0.045,
  smartphonesPerKg: 121,
  homesEnergyYearPerKg: 0.000118,
  gallonsGasolinePerKg: 0.115,
};

function computeEquivalents(totalKgCO2e: number): Equivalents {
  return {
    kmDriven: Math.round(totalKgCO2e / EQUIVALENTS.kmDrivenPerKg),
    treesRequired: Math.round(totalKgCO2e * EQUIVALENTS.treesPerKg),
    smartphonesCharged: Math.round(totalKgCO2e * EQUIVALENTS.smartphonesPerKg),
    homesEnergyYear: Math.round(totalKgCO2e * EQUIVALENTS.homesEnergyYearPerKg * 100) / 100,
    gallonsGasoline: Math.round(totalKgCO2e * EQUIVALENTS.gallonsGasolinePerKg * 100) / 100,
  };
}

@Injectable()
export class CarbonService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async calculateFootprint(
    productId: string,
    methodology: MethodologyVersion = 'ghg_protocol_2024',
  ): Promise<CarbonFootprintResult> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let events = await this.prisma.lifecycleEvent.findMany({
      where: { productId: product.id },
      orderBy: { timestamp: 'asc' },
    });

    if (events.length === 0) {
      events = [];
    }

    const eventData: LifecycleEventData[] = events.map((e) => ({
      stage: e.stage,
      energyKwh: e.energyKwh,
      fuelUsed: e.fuelUsed,
      fuelType: e.fuelType,
      wasteKg: e.wasteKg,
      materialInputs: [],
      transportMode: undefined,
      distanceKm: undefined,
      region: e.location || undefined,
      location: e.location || undefined,
    }));

    const materials = await this.prisma.materialInput.findMany({
      where: { productId: product.id },
    });
    if (materials.length > 0) {
      eventData.forEach((ed) => {
        ed.materialInputs = materials.map((m) => ({
          name: m.name,
          quantity: m.quantity,
          unit: m.unit,
        }));
      });
    }

    const scope1Result = calculateScope1FromEvents(eventData);
    const scope2Result = calculateScope2FromEvents(eventData);
    const scope3Result = calculateScope3FromEvents(eventData);

    const confidenceScore = computeConfidence(eventData);

    const totalFootprint =
      scope1Result.totalScope1 + scope2Result.totalScope2 + scope3Result.totalScope3;

    const byStage = eventData.map((e) => {
      const mapping = getScopeMapping(e.stage);
      let value = 0;

      if (mapping.scope === 1) {
        for (const b of scope1Result.breakdown) {
          if (b.source.includes(e.stage.toLowerCase())) value += b.value;
        }
      } else if (mapping.scope === 2) {
        for (const b of scope2Result.breakdown) {
          if (b.source.includes(e.stage.toLowerCase())) value += b.value;
        }
      } else if (mapping.scope === 3) {
        for (const b of scope3Result.breakdown) {
          if (b.source.includes(e.stage.toLowerCase())) value += b.value;
        }
      }

      return {
        stage: e.stage,
        scope: mapping.scope,
        value: Math.round(value * 100) / 100,
      };
    });

    try {
      await this.prisma.carbonFootprint.create({
        data: {
          productId: product.id,
          scope1: scope1Result.totalScope1,
          scope2: scope2Result.totalScope2,
          scope3: scope3Result.totalScope3,
          totalFootprint: Math.round(totalFootprint * 100) / 100,
          confidenceScore,
          methodology,
          breakdown: {
            byScope: {
              scope1: { total: scope1Result.totalScope1, details: scope1Result.breakdown },
              scope2: { total: scope2Result.totalScope2, details: scope2Result.breakdown },
              scope3: { total: scope3Result.totalScope3, details: scope3Result.breakdown },
            },
            byStage,
          },
        },
      });
    } catch {}

    return {
      productId,
      scope1: scope1Result.totalScope1,
      scope2: scope2Result.totalScope2,
      scope3: scope3Result.totalScope3,
      totalFootprint: Math.round(totalFootprint * 100) / 100,
      confidenceScore,
      methodology,
      breakdown: {
        byScope: {
          scope1: { total: scope1Result.totalScope1, details: scope1Result.breakdown },
          scope2: { total: scope2Result.totalScope2, details: scope2Result.breakdown },
          scope3: { total: scope3Result.totalScope3, details: scope3Result.breakdown },
        },
        byStage,
      },
      equivalents: computeEquivalents(totalFootprint),
      calculatedAt: new Date().toISOString(),
    };
  }

  async getBreakdown(productId: string) {
    const footprint = await this.calculateFootprint(productId);
    return footprint.breakdown;
  }

  async compare(productIds: string[]) {
    const footprints = await Promise.all(
      productIds.map((id) => this.calculateFootprint(id)),
    );

    return {
      products: footprints.map((f) => ({
        productId: f.productId,
        totalFootprint: f.totalFootprint,
        scope1: f.scope1,
        scope2: f.scope2,
        scope3: f.scope3,
        equivalents: f.equivalents,
      })),
      ranking: footprints
        .sort((a, b) => a.totalFootprint - b.totalFootprint)
        .map((f, i) => ({
          rank: i + 1,
          productId: f.productId,
          totalFootprint: f.totalFootprint,
        })),
    };
  }

  getEquivalents(kgCO2e: number): Equivalents {
    return computeEquivalents(kgCO2e);
  }

  getFactors(source?: 'ipcc' | 'epa') {
    if (source === 'epa') {
      return EpaFactors.getAll();
    }
    return IpccFactors.getAll();
  }

  getGridIntensity(region: string) {
    const intensity = GridIntensityFactor.getIntensity(region);
    if (!intensity) {
      throw new NotFoundException(`Grid intensity not found for region: ${region}`);
    }
    return intensity;
  }

  getAllGridIntensities() {
    return GridIntensityFactor.getAll();
  }

  updateGridIntensity(region: string, value: number, unit: string, source: string) {
    return GridIntensityFactor.setIntensity(region, value, unit, source);
  }

  getMethodology() {
    return {
      name: 'GHG Protocol Corporate Standard',
      version: '2024',
      scopes: ['Scope 1: Direct Emissions', 'Scope 2: Energy Indirect', 'Scope 3: Supply Chain'],
      categories: {
        scope1: ['Fuel combustion', 'Industrial processes'],
        scope2: ['Purchased electricity', 'Purchased heat'],
        scope3: ['Upstream (materials, transport)', 'Downstream (distribution, use, disposal)'],
      },
      factorSources: ['IPCC 2024', 'EPA eGRID 2024', 'EPA WARM 2024'],
      confidenceScoring: 'Based on data completeness across energy, fuel, material, transport, waste, and region fields',
    };
  }
}
