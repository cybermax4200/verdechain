import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from '../../../src/products/products.controller';
import { ProductsService } from '../../../src/products/products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    getProductsByOwner: jest.fn(),
    getProductsByBatch: jest.fn(),
    findOne: jest.fn(),
    getProvenance: jest.fn(),
    getLifecycle: jest.fn(),
    getCarbon: jest.fn(),
    getCertificates: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should delegate create to service', async () => {
      const dto = {
        name: 'Organic Shirt',
        sku: 'SKU-1',
        batchNumber: 'B-1',
        productType: 'Apparel',
        originCountry: 'PT',
        manufacturerId: 'mfg-1',
      };
      mockService.create.mockResolvedValue({ id: 'prod-1', ...dto });

      const result = await controller.create(dto as any);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result.id).toBe('prod-1');
    });
  });

  describe('findAll', () => {
    it('should delegate query to service', async () => {
      const query = { page: 1, limit: 10 };
      mockService.findAll.mockResolvedValue({ data: [], total: 0 });

      const result = await controller.findAll(query as any);
      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result.total).toBe(0);
    });
  });

  describe('getByOwner', () => {
    it('should delegate query by owner public key', async () => {
      mockService.getProductsByOwner.mockResolvedValue([{ id: 'prod-1' }]);

      const result = await controller.getByOwner('GBR123');
      expect(service.getProductsByOwner).toHaveBeenCalledWith('GBR123');
      expect(result).toHaveLength(1);
    });
  });

  describe('getByBatch', () => {
    it('should delegate query by batch', async () => {
      mockService.getProductsByBatch.mockResolvedValue([{ id: 'prod-1' }]);

      const result = await controller.getByBatch('BATCH-01');
      expect(service.getProductsByBatch).toHaveBeenCalledWith('BATCH-01');
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return product details', async () => {
      mockService.findOne.mockResolvedValue({ id: 'prod-1', name: 'Cotton Shirt' });

      const result = await controller.findOne('prod-1');
      expect(service.findOne).toHaveBeenCalledWith('prod-1');
      expect(result.id).toBe('prod-1');
    });
  });

  describe('getProvenance', () => {
    it('should return provenance graph nodes and edges', async () => {
      const provenance = { nodes: [{ id: 'n1' }], edges: [] };
      mockService.getProvenance.mockResolvedValue(provenance);

      const result = await controller.getProvenance('prod-1');
      expect(service.getProvenance).toHaveBeenCalledWith('prod-1');
      expect(result).toEqual(provenance);
    });
  });

  describe('getLifecycle', () => {
    it('should return lifecycle events', async () => {
      mockService.getLifecycle.mockResolvedValue([{ id: 'evt-1' }]);

      const result = await controller.getLifecycle('prod-1');
      expect(service.getLifecycle).toHaveBeenCalledWith('prod-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getCarbon', () => {
    it('should return carbon footprints', async () => {
      mockService.getCarbon.mockResolvedValue([{ id: 'carb-1' }]);

      const result = await controller.getCarbon('prod-1');
      expect(service.getCarbon).toHaveBeenCalledWith('prod-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getCertificates', () => {
    it('should return certificates', async () => {
      mockService.getCertificates.mockResolvedValue([{ id: 'cert-1' }]);

      const result = await controller.getCertificates('prod-1');
      expect(service.getCertificates).toHaveBeenCalledWith('prod-1');
      expect(result).toHaveLength(1);
    });
  });
});
