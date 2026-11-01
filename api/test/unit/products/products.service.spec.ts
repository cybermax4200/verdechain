import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from '../../../src/products/products.service';
import { ProductsRepository } from '../../../src/products/products.repository';
import { PrismaService } from '../../../src/prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;
  let repository: ProductsRepository;

  const mockRepo = {
    getNextProductId: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByOwner: jest.fn(),
    findByBatch: jest.fn(),
  };

  const mockPrisma = {
    manufacturer: {
      findUnique: jest.fn(),
    },
    lifecycleEvent: {
      findMany: jest.fn(),
    },
    carbonFootprint: {
      findMany: jest.fn(),
    },
    certificate: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: ProductsRepository, useValue: mockRepo },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
    repository = module.get<ProductsRepository>(ProductsRepository);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = {
      name: 'Organic Cotton T-Shirt',
      description: '100% certified organic cotton',
      sku: 'SKU-TEE-01',
      batchNumber: 'BATCH-2026-A',
      productType: 'Apparel',
      originCountry: 'PT',
      manufacturerId: 'mfg-1',
      metadata: { color: 'green' },
    };

    it('should throw NotFoundException if manufacturer is not found', async () => {
      mockRepo.getNextProductId.mockResolvedValue('PROD-0001');
      (prisma.manufacturer.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(prisma.manufacturer.findUnique).toHaveBeenCalledWith({
        where: { id: dto.manufacturerId },
      });
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('should create product when manufacturer exists', async () => {
      mockRepo.getNextProductId.mockResolvedValue('PROD-0001');
      (prisma.manufacturer.findUnique as jest.Mock).mockResolvedValue({
        id: 'mfg-1',
        name: 'Eco Garments',
      });
      const createdRecord = { id: 'prod-1', productId: 'PROD-0001', ...dto };
      mockRepo.create.mockResolvedValue(createdRecord);

      const result = await service.create(dto);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'PROD-0001',
          name: dto.name,
          manufacturer: { connect: { id: dto.manufacturerId } },
        }),
      );
      expect(result).toEqual(createdRecord);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if product is not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.findOne('prod-missing')).rejects.toThrow(NotFoundException);
    });

    it('should return product when found', async () => {
      const mockProduct = { id: 'prod-1', name: 'Bamboo Straws' };
      mockRepo.findById.mockResolvedValue(mockProduct);

      const result = await service.findOne('prod-1');
      expect(result).toEqual(mockProduct);
    });
  });

  describe('findAll', () => {
    it('should return products matching filters', async () => {
      const filters = { productType: 'Apparel', limit: 10 };
      const expected = { data: [{ id: 'prod-1' }], total: 1 };
      mockRepo.findAll.mockResolvedValue(expected);

      const result = await service.findAll(filters);
      expect(mockRepo.findAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual(expected);
    });
  });

  describe('getProvenance', () => {
    it('should throw NotFoundException if product does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getProvenance('prod-missing')).rejects.toThrow(NotFoundException);
    });

    it('should construct graph nodes and edges across manufacturer, product, and events', async () => {
      const mockProduct = {
        id: 'prod-1',
        name: 'Solar Lamp',
        sku: 'SL-01',
        batchNumber: 'BATCH-99',
        manufacturer: {
          id: 'mfg-1',
          name: 'SolarTech',
          country: 'DE',
        },
      };
      const mockEvents = [
        {
          id: 'evt-1',
          stage: 'HARVESTING',
          location: 'Munich, Germany',
          timestamp: new Date('2026-01-01'),
          energyKwh: 50,
          fuelUsed: 10,
          wasteKg: 2,
        },
        {
          id: 'evt-2',
          stage: 'ASSEMBLY',
          location: 'Berlin, Germany',
          timestamp: new Date('2026-01-05'),
          energyKwh: 120,
          fuelUsed: 0,
          wasteKg: 5,
        },
      ];

      mockRepo.findById.mockResolvedValue(mockProduct);
      (prisma.lifecycleEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const result = await service.getProvenance('prod-1');

      expect(result.nodes).toHaveLength(4); // manufacturer, product, and 2 location nodes
      expect(result.nodes[0]).toEqual({
        id: 'mfg-1',
        type: 'manufacturer',
        label: 'SolarTech',
        metadata: { country: 'DE' },
      });
      expect(result.nodes[1]).toEqual({
        id: 'prod-1',
        type: 'product',
        label: 'Solar Lamp',
        metadata: { sku: 'SL-01', batch: 'BATCH-99' },
      });
      expect(result.nodes[2]).toEqual({
        id: 'evt-1-location',
        type: 'location',
        label: 'Munich, Germany',
        metadata: { stage: 'HARVESTING' },
      });

      expect(result.edges).toHaveLength(2);
      expect(result.edges[0]).toEqual({
        source: 'prod-1',
        target: 'evt-1-location',
        type: 'harvesting',
        timestamp: mockEvents[0]?.timestamp,
        metadata: {
          energyKwh: 50,
          fuelUsed: 10,
          wasteKg: 2,
        },
      });
    });
  });

  describe('getLifecycle', () => {
    it('should throw NotFoundException if product does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getLifecycle('prod-none')).rejects.toThrow(NotFoundException);
    });

    it('should return lifecycle events ordered by timestamp', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'prod-1' });
      const events = [{ id: 'evt-1', stage: 'MANUFACTURING' }];
      (prisma.lifecycleEvent.findMany as jest.Mock).mockResolvedValue(events);

      const result = await service.getLifecycle('prod-1');
      expect(prisma.lifecycleEvent.findMany).toHaveBeenCalledWith({
        where: { productId: 'prod-1' },
        orderBy: { timestamp: 'asc' },
      });
      expect(result).toEqual(events);
    });
  });

  describe('getCarbon', () => {
    it('should throw NotFoundException if product not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getCarbon('prod-missing')).rejects.toThrow(NotFoundException);
    });

    it('should return carbon records for product', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'prod-1' });
      const records = [{ id: 'carb-1', totalFootprint: 15.5 }];
      (prisma.carbonFootprint.findMany as jest.Mock).mockResolvedValue(records);

      const result = await service.getCarbon('prod-1');
      expect(result).toEqual(records);
    });
  });

  describe('getCertificates', () => {
    it('should throw NotFoundException if product not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getCertificates('prod-missing')).rejects.toThrow(NotFoundException);
    });

    it('should return certificates for product', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'prod-1' });
      const certs = [{ id: 'cert-1', title: 'Fair Trade' }];
      (prisma.certificate.findMany as jest.Mock).mockResolvedValue(certs);

      const result = await service.getCertificates('prod-1');
      expect(result).toEqual(certs);
    });
  });

  describe('getProductsByOwner and getProductsByBatch', () => {
    it('should query products by owner public key', async () => {
      const mockList = [{ id: 'prod-1' }];
      mockRepo.findByOwner.mockResolvedValue(mockList);

      const result = await service.getProductsByOwner('GBR123');
      expect(repository.findByOwner).toHaveBeenCalledWith('GBR123');
      expect(result).toEqual(mockList);
    });

    it('should query products by batch', async () => {
      const mockList = [{ id: 'prod-1' }];
      mockRepo.findByBatch.mockResolvedValue(mockList);

      const result = await service.getProductsByBatch('BATCH-001');
      expect(repository.findByBatch).toHaveBeenCalledWith('BATCH-001');
      expect(result).toEqual(mockList);
    });
  });
});
