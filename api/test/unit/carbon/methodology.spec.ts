import {
  getScopeMapping,
  getApplicableFactors,
  computeConfidence,
} from '../../../src/carbon-accounting/methodology';

describe('Methodology Engine', () => {
  describe('getScopeMapping', () => {
    it('maps MANUFACTURING to Scope 1', () => {
      const mapping = getScopeMapping('MANUFACTURING');
      expect(mapping.scope).toBe(1);
      expect(mapping.category).toBe('direct');
    });

    it('maps RETAIL to Scope 2', () => {
      const mapping = getScopeMapping('RETAIL');
      expect(mapping.scope).toBe(2);
      expect(mapping.category).toBe('energy_indirect');
    });

    it('maps RAW_MATERIAL_EXTRACTION to Scope 3', () => {
      const mapping = getScopeMapping('RAW_MATERIAL_EXTRACTION');
      expect(mapping.scope).toBe(3);
      expect(mapping.category).toBe('upstream');
    });

    it('maps END_OF_LIFE to Scope 3 downstream', () => {
      const mapping = getScopeMapping('END_OF_LIFE');
      expect(mapping.scope).toBe(3);
      expect(mapping.category).toBe('downstream');
    });

    it('maps unknown stages to Scope 3 upstream', () => {
      const mapping = getScopeMapping('UNKNOWN_STAGE');
      expect(mapping.scope).toBe(3);
      expect(mapping.category).toBe('upstream');
    });

    it('maps all lifecycle stages correctly', () => {
      expect(getScopeMapping('TRANSPORT_TO_SUPPLIER').scope).toBe(3);
      expect(getScopeMapping('TRANSPORT_TO_DISTRIBUTOR').scope).toBe(3);
      expect(getScopeMapping('DISTRIBUTION').scope).toBe(3);
      expect(getScopeMapping('USE').scope).toBe(3);
    });
  });

  describe('getApplicableFactors', () => {
    it('returns grid factor for a region', () => {
      const event = { stage: 'MANUFACTURING', region: 'us' } as any;
      const factors = getApplicableFactors(event);
      expect(factors.gridFactor).toBeDefined();
      expect(factors.gridFactor!.value).toBeGreaterThan(0);
    });

    it('returns fuel factor when fuel type is provided', () => {
      const event = { stage: 'MANUFACTURING', fuelType: 'natural_gas' } as any;
      const factors = getApplicableFactors(event);
      expect(factors.fuelFactor).toBeDefined();
      expect(factors.fuelFactor!.value).toBeCloseTo(0.20196, 4);
    });

    it('returns transport factor when transport mode is provided', () => {
      const event = { stage: 'TRANSPORT_TO_DISTRIBUTOR', transportMode: 'road_freight_diesel' } as any;
      const factors = getApplicableFactors(event);
      expect(factors.transportFactor).toBeDefined();
    });

    it('returns global grid average when no region specified', () => {
      const event = { stage: 'MANUFACTURING' } as any;
      const factors = getApplicableFactors(event);
      expect(factors.gridFactor).toBeDefined();
    });
  });

  describe('computeConfidence', () => {
    it('returns 0 for empty events', () => {
      expect(computeConfidence([])).toBe(0);
    });

    it('returns higher score for complete data', () => {
      const events = [
        {
          stage: 'MANUFACTURING',
          energyKwh: 1000,
          fuelUsed: 500,
          fuelType: 'natural_gas',
          region: 'us',
        },
      ];
      const score = computeConfidence(events);
      expect(score).toBeGreaterThan(50);
    });

    it('returns lower score for sparse data', () => {
      const events = [
        { stage: 'MANUFACTURING' },
      ];
      const score = computeConfidence(events);
      expect(score).toBeLessThan(50);
    });

    it('scores 100 for fully complete event', () => {
      const events = [
        {
          stage: 'MANUFACTURING',
          energyKwh: 1000,
          fuelUsed: 500,
          fuelType: 'natural_gas',
          materialInputs: [{ name: 'steel_bof', quantity: 100, unit: 'kg' }],
          transportMode: 'road_freight_diesel',
          distanceKm: 100,
          wasteKg: 50,
          region: 'us',
        },
      ];
      const score = computeConfidence(events);
      expect(score).toBe(100);
    });

    it('averages confidence across multiple events', () => {
      const events = [
        { stage: 'MANUFACTURING', energyKwh: 1000, region: 'eu', fuelUsed: 100, fuelType: 'diesel' },
        { stage: 'RETAIL' },
      ];
      const score = computeConfidence(events);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(100);
    });
  });
});
