import { Test, TestingModule } from '@nestjs/testing';
import { SupplyChainController } from '../../../src/supply-chain/supply-chain.controller';
import { SupplyChainService } from '../../../src/supply-chain/supply-chain.service';
import { AggregationService } from '../../../src/supply-chain/aggregation.service';

describe('SupplyChainController', () => {
  let controller: SupplyChainController;
  let service: SupplyChainService;
  let aggregationService: AggregationService;

  const mockSupplyChainService = {
    recordEvent: jest.fn(),
    batchRecord: jest.fn(),
    getTimeline: jest.fn(),
    getParticipants: jest.fn(),
  };

  const mockAggregationService = {
    buildProvenanceGraph: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupplyChainController],
      providers: [
        {
          provide: SupplyChainService,
          useValue: mockSupplyChainService,
        },
        {
          provide: AggregationService,
          useValue: mockAggregationService,
        },
      ],
    }).compile();

    controller = module.get<SupplyChainController>(SupplyChainController);
    service = module.get<SupplyChainService>(SupplyChainService);
    aggregationService = module.get<AggregationService>(AggregationService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('recordEvent', () => {
    it('should delegate event recording to service', async () => {
      const dto = {
        productId: 'prod-1',
        stage: 'RAW_MATERIALS',
        description: 'Cotton harvest',
        location: 'Field A',
        timestamp: new Date().toISOString(),
      };
      mockSupplyChainService.recordEvent.mockResolvedValue({ id: 'evt-1', ...dto });

      const result = await controller.recordEvent(dto as any);
      expect(service.recordEvent).toHaveBeenCalledWith(dto);
      expect(result.id).toBe('evt-1');
    });
  });

  describe('batchRecord', () => {
    it('should delegate batch recording to service', async () => {
      const dto = {
        events: [
          {
            productId: 'prod-1',
            stage: 'RAW_MATERIALS',
            description: 'Event 1',
            location: 'Location 1',
            timestamp: new Date().toISOString(),
          },
        ],
      };
      mockSupplyChainService.batchRecord.mockResolvedValue([{ id: 'evt-1' }]);

      const result = await controller.batchRecord(dto as any);
      expect(service.batchRecord).toHaveBeenCalledWith(dto.events);
      expect(result).toHaveLength(1);
    });
  });

  describe('getTimeline', () => {
    it('should return timeline for product', async () => {
      mockSupplyChainService.getTimeline.mockResolvedValue({
        productId: 'prod-1',
        events: [],
        emissionsByStage: {},
      });

      const result = await controller.getTimeline('prod-1');
      expect(service.getTimeline).toHaveBeenCalledWith('prod-1');
      expect(result.productId).toBe('prod-1');
    });
  });

  describe('getParticipants', () => {
    it('should return participants for product', async () => {
      mockSupplyChainService.getParticipants.mockResolvedValue(['PART_1', 'PART_2']);

      const result = await controller.getParticipants('prod-1');
      expect(service.getParticipants).toHaveBeenCalledWith('prod-1');
      expect(result).toEqual(['PART_1', 'PART_2']);
    });
  });

  describe('getProvenance', () => {
    it('should delegate provenance graph creation to aggregation service', async () => {
      mockAggregationService.buildProvenanceGraph.mockResolvedValue({ nodes: [], edges: [] });

      const result = await controller.getProvenance('prod-1');
      expect(aggregationService.buildProvenanceGraph).toHaveBeenCalledWith('prod-1');
      expect(result.nodes).toEqual([]);
    });
  });
});
