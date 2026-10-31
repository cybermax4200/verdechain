import { VerdeChainClient } from '../src/client';
import { LifecycleAPI, type RecordEventData } from '../src/lifecycle';

describe('LifecycleAPI', () => {
  const client = new VerdeChainClient({ apiUrl: 'http://test.api' });
  const lifecycle = new LifecycleAPI(client);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getEvents and getTimeline', () => {
    it('should retrieve lifecycle events for a product', async () => {
      const mockEvents = [
        {
          id: 'evt-1',
          productId: 'prod-1',
          stage: 'raw_material_extraction' as const,
          description: 'Sourcing timber',
          location: 'Canada',
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      ];

      const requestSpy = jest.spyOn(client, 'request').mockResolvedValue(mockEvents);

      const events = await lifecycle.getEvents('prod-1');
      expect(requestSpy).toHaveBeenCalledWith({
        method: 'GET',
        url: '/products/prod-1/lifecycle',
      });
      expect(events).toEqual(mockEvents);

      const timeline = await lifecycle.getTimeline('prod-1');
      expect(timeline).toEqual(mockEvents);
    });
  });

  describe('recordEvent', () => {
    it('should submit a lifecycle event', async () => {
      const eventData: RecordEventData = {
        productId: 'prod-1',
        stage: 'manufacturing',
        description: 'Molding parts',
        location: 'Factory A',
        energyKwh: 350,
        fuelUsed: 12,
        fuelType: 'diesel',
        wasteKg: 5,
      };

      const mockResult = { id: 'evt-2', ...eventData, timestamp: '2024-01-02T00:00:00.000Z' };
      const requestSpy = jest.spyOn(client, 'request').mockResolvedValue(mockResult);

      const result = await lifecycle.recordEvent(eventData);
      expect(requestSpy).toHaveBeenCalledWith({
        method: 'POST',
        url: '/supply-chain/events',
        data: eventData,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('batchRecordEvents', () => {
    it('should submit multiple lifecycle events in batch', async () => {
      const batchData: RecordEventData[] = [
        { productId: 'prod-1', stage: 'packaging', location: 'Plant 1' },
        { productId: 'prod-1', stage: 'distribution', location: 'Warehouse 2' },
      ];

      const mockResult = [
        { id: 'evt-3', ...batchData[0], timestamp: '2024-01-03T00:00:00.000Z' },
        { id: 'evt-4', ...batchData[1], timestamp: '2024-01-04T00:00:00.000Z' },
      ];

      const requestSpy = jest.spyOn(client, 'request').mockResolvedValue(mockResult);

      const result = await lifecycle.batchRecordEvents(batchData);
      expect(requestSpy).toHaveBeenCalledWith({
        method: 'POST',
        url: '/supply-chain/events/batch',
        data: { events: batchData },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('getParticipants', () => {
    it('should fetch participants in the product supply chain', async () => {
      const mockParticipants = [
        { name: 'Forestry Supplier', role: 'RAW_MATERIALS' },
        { name: 'Eco Assembly Ltd', role: 'MANUFACTURER' },
      ];

      const requestSpy = jest.spyOn(client, 'request').mockResolvedValue(mockParticipants);

      const participants = await lifecycle.getParticipants('prod-1');
      expect(requestSpy).toHaveBeenCalledWith({
        method: 'GET',
        url: '/products/prod-1/participants',
      });
      expect(participants).toEqual(mockParticipants);
    });
  });
});
