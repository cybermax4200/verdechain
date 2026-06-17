import { VerdeChainClient } from '../src/client';
import { CarbonAPI } from '../src/carbon';

describe('CarbonAPI', () => {
  const client = new VerdeChainClient({ apiUrl: 'http://test.api' });
  const carbon = new CarbonAPI(client);

  describe('getFootprint', () => {
    it('should fetch carbon footprint by product id', async () => {
      const mockFootprint = {
        id: '1',
        productId: '123',
        scope1: 10.5,
        scope2: 5.2,
        scope3: 20.1,
        totalFootprint: 35.8,
        methodology: 'GHG Protocol 2024',
        calculatedAt: '2024-01-01T00:00:00Z',
      };
      const requestSpy = jest.spyOn(client, 'request');
      requestSpy.mockResolvedValue(mockFootprint);

      const result = await carbon.getFootprint('123');
      expect(result.totalFootprint).toBe(35.8);
      expect(result.scope1).toBe(10.5);
      expect(requestSpy).toHaveBeenCalledWith({
        method: 'GET',
        url: '/carbon/footprint/123',
      });

      requestSpy.mockRestore();
    });
  });

  describe('getBreakdown', () => {
    it('should fetch emissions breakdown', async () => {
      const mockBreakdown = [
        { stage: 'manufacturing', scope1: 10, scope2: 5, scope3: 0, total: 15 },
        { stage: 'transportation', scope1: 0, scope2: 0, scope3: 8, total: 8 },
      ];
      const requestSpy = jest.spyOn(client, 'request');
      requestSpy.mockResolvedValue(mockBreakdown);

      const result = await carbon.getBreakdown('123');
      expect(result).toHaveLength(2);
      expect(result[0].stage).toBe('manufacturing');

      requestSpy.mockRestore();
    });
  });

  describe('compare', () => {
    it('should compare multiple products', async () => {
      const mockComparison = [
        { productId: '1', totalFootprint: 10 },
        { productId: '2', totalFootprint: 20 },
      ];
      const requestSpy = jest.spyOn(client, 'request');
      requestSpy.mockResolvedValue(mockComparison);

      const result = await carbon.compare(['1', '2']);
      expect(result).toHaveLength(2);

      requestSpy.mockRestore();
    });
  });
});
