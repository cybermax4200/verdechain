import {
  calculateEnergyEmissions,
  getGridIntensityForRegion,
  calculateScope2FromEvents,
} from '../../../src/carbon-accounting/calculators/scope2';

describe('Scope2 - Energy Indirect Emissions', () => {
  describe('calculateEnergyEmissions', () => {
    it('calculates emissions from kWh and grid intensity', () => {
      const result = calculateEnergyEmissions(1000, 0.475);
      expect(result).toBeCloseTo(475, 0);
    });

    it('returns 0 for zero kWh', () => {
      const result = calculateEnergyEmissions(0, 0.475);
      expect(result).toBe(0);
    });

    it('scales linearly with kWh', () => {
      const result1 = calculateEnergyEmissions(500, 0.475);
      const result2 = calculateEnergyEmissions(1000, 0.475);
      expect(result2).toBeCloseTo(result1 * 2, 1);
    });

    it('returns 0 for zero grid intensity', () => {
      const result = calculateEnergyEmissions(1000, 0);
      expect(result).toBe(0);
    });
  });

  describe('getGridIntensityForRegion', () => {
    it('returns eGRID value for known region', () => {
      const intensity = getGridIntensityForRegion('us');
      expect(intensity).toBeGreaterThan(0);
    });

    it('returns global average for unknown region', () => {
      const intensity = getGridIntensityForRegion('unknown_region');
      expect(intensity).toBe(0.475);
    });
  });

  describe('calculateScope2FromEvents', () => {
    it('calculates emissions from energy events', () => {
      const events = [
        { stage: 'MANUFACTURING', energyKwh: 1000, region: 'us' },
        { stage: 'RETAIL', energyKwh: 500, region: 'eu' },
      ];
      const result = calculateScope2FromEvents(events);
      expect(result.purchasedElectricity).toBeGreaterThan(0);
      expect(result.totalScope2).toBeGreaterThan(0);
      expect(result.breakdown.length).toBe(2);
    });

    it('returns zero for events without energy data', () => {
      const events = [
        { stage: 'RAW_MATERIAL_EXTRACTION' },
      ];
      const result = calculateScope2FromEvents(events as any);
      expect(result.totalScope2).toBe(0);
      expect(result.breakdown.length).toBe(0);
    });
  });
});
