import { Test, TestingModule } from '@nestjs/testing';
import { CarbonService } from '../../src/carbon-accounting/carbon.service';
import { PrismaService } from '../../src/prisma/prisma.service';
describe('CarbonFootprint Integration', () => {
  let carbonService: CarbonService;
  let prismaService: PrismaService;

  const mockProduct = {
    id: 'test-product-id',
    productId: 1,
    manufacturerId: 'test-mfr-id',
    name: 'Test Product',
    status: 'ACTIVE' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    description: null,
    sku: null,
    batchNumber: null,
    productType: null,
    originCountry: null,
    ipfsHash: null,
    metadata: null,
  };

  const mockEvents = [
    {
      id: 'event-1',
      productId: 'test-product-id',
      stage: 'RAW_MATERIAL_EXTRACTION' as const,
      description: 'Extracted raw materials',
      location: 'us',
      timestamp: new Date(),
      energyKwh: null,
      fuelUsed: 500,
      fuelType: 'diesel',
      wasteKg: null,
      metadata: null,
      txHash: null,
      createdAt: new Date(),
    },
    {
      id: 'event-2',
      productId: 'test-product-id',
      stage: 'MANUFACTURING' as const,
      description: 'Manufactured product',
      location: 'us',
      timestamp: new Date(),
      energyKwh: 10000,
      fuelUsed: 2000,
      fuelType: 'natural_gas',
      wasteKg: 150,
      metadata: null,
      txHash: null,
      createdAt: new Date(),
    },
    {
      id: 'event-3',
      productId: 'test-product-id',
      stage: 'TRANSPORT_TO_DISTRIBUTOR' as const,
      description: 'Shipped to distributor',
      location: 'us',
      timestamp: new Date(),
      energyKwh: null,
      fuelUsed: 800,
      fuelType: 'diesel',
      wasteKg: null,
      metadata: null,
      txHash: null,
      createdAt: new Date(),
    },
    {
      id: 'event-4',
      productId: 'test-product-id',
      stage: 'END_OF_LIFE' as const,
      description: 'Disposed',
      location: 'us',
      timestamp: new Date(),
      energyKwh: null,
      fuelUsed: null,
      fuelType: null,
      wasteKg: 200,
      metadata: null,
      txHash: null,
      createdAt: new Date(),
    },
  ];

  const mockMaterials = [
    {
      id: 'mat-1',
      productId: 'test-product-id',
      name: 'steel_bof',
      quantity: 50,
      unit: 'kg',
      source: null,
      originCountry: null,
      carbonContent: null,
      isRecycled: false,
      createdAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const mockPrisma = {
      product: {
        findUnique: jest.fn().mockResolvedValue(mockProduct),
      },
      lifecycleEvent: {
        findMany: jest.fn().mockResolvedValue(mockEvents),
      },
      materialInput: {
        findMany: jest.fn().mockResolvedValue(mockMaterials),
      },
      carbonFootprint: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CarbonService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    carbonService = module.get<CarbonService>(CarbonService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('calculates full cradle-to-grave footprint', async () => {
    const result = await carbonService.calculateFootprint('test-product-id');
    expect(result.productId).toBe('test-product-id');
    expect(result.totalFootprint).toBeGreaterThan(0);
    expect(result.scope1).toBeGreaterThan(0);
    expect(result.scope2).toBeGreaterThan(0);
    expect(result.scope3).toBeGreaterThan(0);
    expect(result.confidenceScore).toBeGreaterThan(0);
    expect(result.methodology).toBe('ghg_protocol_2024');
  });

  it('returns breakdown by scope and stage', async () => {
    const result = await carbonService.calculateFootprint('test-product-id');
    expect(result.breakdown.byScope.scope1).toBeDefined();
    expect(result.breakdown.byScope.scope2).toBeDefined();
    expect(result.breakdown.byScope.scope3).toBeDefined();
    expect(result.breakdown.byStage.length).toBeGreaterThan(0);
  });

  it('returns consumer-friendly equivalents', async () => {
    const result = await carbonService.calculateFootprint('test-product-id');
    expect(result.equivalents.kmDriven).toBeGreaterThan(0);
    expect(result.equivalents.treesRequired).toBeGreaterThan(0);
    expect(result.equivalents.smartphonesCharged).toBeGreaterThan(0);
  });

  it('compares multiple products', async () => {
    (prismaService.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

    const result = await carbonService.compare(['test-product-id', 'test-product-id']);
    expect(result.products).toHaveLength(2);
    expect(result.ranking).toHaveLength(2);
  });
});
