import {
  calculateUpstreamEmissions,
  calculateDownstreamEmissions,
  calculateScope3FromEvents,
} from '../../../src/carbon-accounting/calculators/scope3';

describe('Scope3 - Supply Chain Emissions', () => {
  describe('calculateUpstreamEmissions', () => {
    it('calculates material emissions', () => {
      const result = calculateUpstreamEmissions(
        [{ name: 'cement_clinker', quantity: 100, unit: 'kg' }],
        [],
      );
      expect(result).toBeCloseTo(52.5, 1);
    });

    it('calculates transport emissions', () => {
      const result = calculateUpstreamEmissions(
        [],
        [{ mode: 'road_freight_diesel', distanceKm: 100, massKg: 1000 }],
      );
      expect(result).toBeCloseTo((100 * 1000 * 0.162) / 1000, 1);
    });

    it('calculates combined material and transport emissions', () => {
      const result = calculateUpstreamEmissions(
        [{ name: 'steel_bof', quantity: 50, unit: 'kg' }],
        [{ mode: 'maritime_container', distanceKm: 500, massKg: 2000 }],
      );
      expect(result).toBeGreaterThan(0);
    });

    it('returns 0 for empty inputs', () => {
      const result = calculateUpstreamEmissions([], []);
      expect(result).toBe(0);
    });

    it('handles unknown materials', () => {
      const result = calculateUpstreamEmissions(
        [{ name: 'unobtainium', quantity: 100, unit: 'kg' }],
        [],
      );
      expect(result).toBe(0);
    });
  });

  describe('calculateDownstreamEmissions', () => {
    it('calculates distribution emissions', () => {
      const result = calculateDownstreamEmissions(
        [{ mode: 'road_freight_diesel', distanceKm: 200, massKg: 1000 }],
        { energyKwh: 0, gridIntensity: 0 },
        [],
      );
      expect(result).toBeGreaterThan(0);
    });

    it('calculates use phase emissions', () => {
      const result = calculateDownstreamEmissions([], { energyKwh: 500, gridIntensity: 0.475 }, []);
      expect(result).toBeCloseTo(237.5, 1);
    });

    it('calculates disposal emissions', () => {
      const result = calculateDownstreamEmissions([], { energyKwh: 0, gridIntensity: 0 }, [
        { wasteKg: 100, method: 'landfill_mixed' },
      ]);
      expect(result).toBeCloseTo(58.9, 1);
    });

    it('handles empty inputs', () => {
      const result = calculateDownstreamEmissions([], { energyKwh: 0, gridIntensity: 0 }, []);
      expect(result).toBe(0);
    });

    it('aggregates all downstream sources', () => {
      const result = calculateDownstreamEmissions(
        [{ mode: 'road_freight_diesel', distanceKm: 200, massKg: 500 }],
        { energyKwh: 300, gridIntensity: 0.475 },
        [{ wasteKg: 50, method: 'recycling_mixed' }],
      );
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('calculateScope3FromEvents', () => {
    it('calculates scope3 from lifecycle events', () => {
      const events = [
        {
          stage: 'RAW_MATERIAL_EXTRACTION',
          materialInputs: [{ name: 'cement_clinker', quantity: 100, unit: 'kg' }],
        },
        {
          stage: 'END_OF_LIFE',
          wasteKg: 50,
        },
      ];
      const result = calculateScope3FromEvents(events as any);
      expect(result.totalScope3).toBeGreaterThan(0);
      expect(result.upstreamEmissions).toBeGreaterThan(0);
      expect(result.downstreamEmissions).toBeGreaterThan(0);
    });

    it('returns zero for non-scope3 events', () => {
      const events = [{ stage: 'MANUFACTURING', fuelUsed: 100, fuelType: 'natural_gas' }];
      const result = calculateScope3FromEvents(events as any);
      expect(result.totalScope3).toBe(0);
    });
  });
});
