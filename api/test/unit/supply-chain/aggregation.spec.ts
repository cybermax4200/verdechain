import { Test, TestingModule } from '@nestjs/testing';
import { AggregationService } from '../../../src/supply-chain/aggregation.service';
import { PrismaService } from '../../../src/prisma/prisma.service';

describe('AggregationService', () => {
  let service: AggregationService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AggregationService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AggregationService>(AggregationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should return empty graph when product is not found', async () => {
    (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

    const graph = await service.buildProvenanceGraph('nonexistent-id');
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it('should construct nodes and edges for manufacturer, events, materials, and certificates', async () => {
    const mockProductData = {
      id: 'prod-100',
      name: 'Eco Sneaker',
      sku: 'SNK-01',
      batchNumber: 'BATCH-2024',
      productType: 'FOOTWEAR',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      manufacturer: {
        id: 'mfr-1',
        name: 'Sustainable Kicks',
        country: 'VN',
      },
      lifecycleEvents: [
        {
          id: 'evt-1',
          stage: 'MANUFACTURING',
          location: 'Factory VN',
          energyKwh: 120,
          fuelUsed: 10,
          wasteKg: 2,
          timestamp: new Date('2024-01-02T00:00:00Z'),
        },
      ],
      materialInputs: [
        {
          id: 'mat-1',
          name: 'Recycled Rubber',
          quantity: 2.5,
          unit: 'kg',
          originCountry: 'VN',
          isRecycled: true,
          createdAt: new Date('2024-01-01T12:00:00Z'),
        },
      ],
      certificates: [
        {
          id: 'cert-1',
          title: 'Fair Trade Certified',
          certType: 'FAIR_TRADE',
          status: 'ACTIVE',
          issuedAt: new Date('2024-01-03T00:00:00Z'),
        },
      ],
    };

    (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProductData);

    const graph = await service.buildProvenanceGraph('prod-100');

    expect(graph.nodes.length).toBeGreaterThanOrEqual(4);
    const nodeTypes = graph.nodes.map((n) => n.type);
    expect(nodeTypes).toContain('manufacturer');
    expect(nodeTypes).toContain('product');
    expect(nodeTypes).toContain('lifecycle_event');
    expect(nodeTypes).toContain('material');
    expect(nodeTypes).toContain('certificate');

    const edgeTypes = graph.edges.map((e) => e.type);
    expect(edgeTypes).toContain('manufactures');
    expect(edgeTypes).toContain('inputs');
    expect(edgeTypes).toContain('certifies');
  });
});
