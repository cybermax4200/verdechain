import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SupplyChainService } from '../../../src/supply-chain/supply-chain.service';
import { PrismaService } from '../../../src/prisma/prisma.service';

describe('SupplyChainService', () => {
  let service: SupplyChainService;

  const mockPrisma = {
    product: {
      findUnique: jest.fn(),
    },
    lifecycleEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplyChainService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<SupplyChainService>(SupplyChainService);
    jest.clearAllMocks();
  });

  describe('recordEvent', () => {
    it('should throw NotFoundException if product is not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.recordEvent({
          productId: 'prod-none',
          stage: 'MANUFACTURING',
          description: 'Assembly',
          location: 'Factory 1',
          timestamp: new Date().toISOString(),
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create lifecycle event for valid product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1' });
      const createdEvent = {
        id: 'evt-1',
        productId: 'prod-1',
        stage: 'MANUFACTURING',
        description: 'Assembly',
        location: 'Factory 1',
        timestamp: new Date('2024-01-01'),
        energyKwh: 120,
        fuelUsed: 10,
        fuelType: 'diesel',
        wasteKg: 5,
      };
      mockPrisma.lifecycleEvent.create.mockResolvedValue(createdEvent);

      const result = await service.recordEvent({
        productId: 'prod-1',
        stage: 'MANUFACTURING',
        description: 'Assembly',
        location: 'Factory 1',
        timestamp: '2024-01-01T00:00:00Z',
        energyKwh: 120,
        fuelUsed: 10,
        fuelType: 'diesel',
        wasteKg: 5,
      } as any);

      expect(mockPrisma.lifecycleEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          productId: 'prod-1',
          stage: 'MANUFACTURING',
          energyKwh: 120,
        }),
      });
      expect(result).toEqual(createdEvent);
    });
  });

  describe('batchRecord', () => {
    it('should record multiple events and return results', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1' });
      mockPrisma.lifecycleEvent.create.mockImplementation((args) =>
        Promise.resolve({ id: 'evt-gen', ...args.data }),
      );

      const eventsDto = [
        {
          productId: 'prod-1',
          stage: 'RAW_MATERIALS',
          description: 'Sourcing',
          location: 'Farm A',
          timestamp: '2024-01-01T00:00:00Z',
        },
        {
          productId: 'prod-1',
          stage: 'MANUFACTURING',
          description: 'Processing',
          location: 'Mill B',
          timestamp: '2024-01-02T00:00:00Z',
        },
      ];

      const results = await service.batchRecord(eventsDto as any);
      expect(results).toHaveLength(2);
      expect(mockPrisma.lifecycleEvent.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('getTimeline', () => {
    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.getTimeline('prod-none')).rejects.toThrow(NotFoundException);
    });

    it('should calculate estimated emissions by stage for timeline events', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1' });
      mockPrisma.lifecycleEvent.findMany.mockResolvedValue([
        {
          id: 'evt-1',
          stage: 'MANUFACTURING',
          timestamp: new Date('2024-01-01'),
          energyKwh: 100, // 100 * 0.5 = 50
          fuelUsed: 10,
          fuelType: 'diesel', // 10 * 2.68 = 26.8
          wasteKg: 10, // 10 * 0.6 = 6 -> total 82.8
        },
        {
          id: 'evt-2',
          stage: 'MANUFACTURING',
          timestamp: new Date('2024-01-02'),
          energyKwh: 50, // 25
          fuelUsed: null,
          fuelType: null,
          wasteKg: null, // total 25 -> stage total 107.8
        },
        {
          id: 'evt-3',
          stage: 'TRANSPORT',
          timestamp: new Date('2024-01-03'),
          energyKwh: null,
          fuelUsed: 20,
          fuelType: 'unknown_fuel', // 20 * default 2.5 = 50
          wasteKg: null,
        },
      ]);

      const timeline = await service.getTimeline('prod-1');
      expect(timeline.productId).toBe('prod-1');
      expect(timeline.events).toHaveLength(3);
      expect(timeline.emissionsByStage.manufacturing).toBeCloseTo(107.8, 1);
      expect(timeline.emissionsByStage.transport).toBeCloseTo(50, 1);
    });
  });

  describe('getParticipants', () => {
    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.getParticipants('prod-none')).rejects.toThrow(NotFoundException);
    });

    it('should return unique participants', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        manufacturer: { publicKey: 'PUB_MFG' },
        lifecycleEvents: [
          { location: 'Warehouse 1' },
          { location: 'Distribution Hub' },
          { location: 'Warehouse 1' },
          { location: null },
        ],
      });

      const participants = await service.getParticipants('prod-1');
      expect(participants).toEqual(['PUB_MFG', 'Warehouse 1', 'Distribution Hub']);
    });
  });
});
