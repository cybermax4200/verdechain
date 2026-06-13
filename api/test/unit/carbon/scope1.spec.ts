import {
  calculateDirectEmissions,
  calculateProcessEmissions,
  calculateScope1FromEvents,
} from '../../../src/carbon-accounting/calculators/scope1';

describe('Scope1 - Direct Emissions', () => {
  describe('calculateDirectEmissions', () => {
    it('calculates natural gas emissions correctly', () => {
      const result = calculateDirectEmissions(1000, 'natural_gas');
      expect(result).toBeCloseTo(201.96, 1);
    });

    it('calculates diesel emissions correctly', () => {
      const result = calculateDirectEmissions(500, 'diesel');
      expect(result).toBeCloseTo(133.38, 1);
    });

    it('returns 0 for unknown fuel type', () => {
      const result = calculateDirectEmissions(100, 'hydrogen');
      expect(result).toBe(0);
    });

    it('converts kg to kWh when unit is kg', () => {
      const result = calculateDirectEmissions(100, 'natural_gas', 'kg');
      expect(result).toBeGreaterThan(200);
    });

    it('handles zero fuel use', () => {
      const result = calculateDirectEmissions(0, 'natural_gas');
      expect(result).toBe(0);
    });
  });

  describe('calculateProcessEmissions', () => {
    it('calculates cement emissions correctly', () => {
      const result = calculateProcessEmissions([
        { name: 'cement_clinker', quantity: 100 },
      ]);
      expect(result).toBeCloseTo(52.5, 1);
    });

    it('calculates multiple process emissions', () => {
      const result = calculateProcessEmissions([
        { name: 'cement_clinker', quantity: 100 },
        { name: 'steel_bof', quantity: 50 },
      ]);
      expect(result).toBeCloseTo(52.5 + 116.5, 1);
    });

    it('returns 0 for unknown processes', () => {
      const result = calculateProcessEmissions([
        { name: 'unknown_process', quantity: 100 },
      ]);
      expect(result).toBe(0);
    });

    it('handles empty input', () => {
      const result = calculateProcessEmissions([]);
      expect(result).toBe(0);
    });
  });

  describe('calculateScope1FromEvents', () => {
    it('aggregates emissions from multiple events', () => {
      const events = [
        { stage: 'MANUFACTURING', fuelUsed: 1000, fuelType: 'natural_gas' },
        { stage: 'MANUFACTURING', fuelUsed: 500, fuelType: 'diesel' },
      ];
      const result = calculateScope1FromEvents(events as any);
      expect(result.totalScope1).toBeGreaterThan(0);
      expect(result.combustionEmissions).toBeGreaterThan(0);
      expect(result.breakdown.length).toBe(2);
    });

    it('includes process emissions from material inputs', () => {
      const events = [
        {
          stage: 'MANUFACTURING',
          materialInputs: [{ name: 'cement_clinker', quantity: 100, unit: 'kg' }],
        },
      ];
      const result = calculateScope1FromEvents(events as any);
      expect(result.processEmissions).toBeGreaterThan(0);
      expect(result.totalScope1).toBeGreaterThan(0);
    });
  });
});
