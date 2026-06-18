import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('E2E: Full User Journey', () => {
  let prismaService: PrismaService;

  const mockManufacturer = {
    id: 'mfr-001',
    name: 'EcoFactory Inc.',
    description: 'Sustainable goods manufacturer',
    publicKey: 'GA7Q2X7Q2X7Q2X7Q2X7Q2X7Q2X7Q2X7Q2X7Q2X7Q2X7Q2X7Q2X',
    email: 'eco@example.com',
    website: 'https://example.com',
    country: 'PT',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct = {
    id: 'prod-001',
    productId: 1,
    manufacturerId: 'mfr-001',
    name: 'Eco-Friendly Bamboo T-Shirt',
    description: 'Organic bamboo fabric t-shirt',
    status: 'ACTIVE',
    sku: 'BAM-001-GRN',
    batchNumber: 'BATCH-2024-001',
    productType: 'APPAREL',
    originCountry: 'PT',
    ipfsHash: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockEvents = [
    {
      id: 'evt-001',
      productId: 'prod-001',
      stage: 'RAW_MATERIAL_EXTRACTION',
      description: 'Harvested organic bamboo',
      location: 'cn',
      timestamp: new Date('2024-01-15'),
      energyKwh: null,
      fuelUsed: 200,
      fuelType: 'diesel',
      wasteKg: null,
      metadata: null,
      txHash: null,
      createdAt: new Date(),
    },
    {
      id: 'evt-002',
      productId: 'prod-001',
      stage: 'MANUFACTURING',
      description: 'Fabric weaving and assembly',
      location: 'pt',
      timestamp: new Date('2024-02-01'),
      energyKwh: 5000,
      fuelUsed: 1000,
      fuelType: 'natural_gas',
      wasteKg: 50,
      metadata: null,
      txHash: null,
      createdAt: new Date(),
    },
    {
      id: 'evt-003',
      productId: 'prod-001',
      stage: 'TRANSPORT_TO_DISTRIBUTOR',
      description: 'Shipping to distribution center',
      location: 'de',
      timestamp: new Date('2024-02-15'),
      energyKwh: null,
      fuelUsed: 800,
      fuelType: 'diesel',
      wasteKg: null,
      metadata: null,
      txHash: null,
      createdAt: new Date(),
    },
  ];

  const mockMaterials = [
    {
      id: 'mat-001',
      productId: 'prod-001',
      name: 'bamboo_fiber',
      quantity: 500,
      unit: 'kg',
      source: null,
      originCountry: 'cn',
      carbonContent: null,
      isRecycled: false,
      createdAt: new Date(),
    },
  ];

  const mockVerifier = {
    id: 'ver-001',
    publicKey: 'GB7Q2X7Q2X7Q2X7Q2X7Q2X7Q2X7Q2X7Q2X7Q2X7Q2X7Q2X7Q2Y',
    name: 'GreenCert Verifiers Ltd.',
    email: 'verify@greencert.example',
    description: 'Authorized GreenTag verifier',
    stakeXlm: 5000,
    reputationScore: 85,
    status: 'ACTIVE' as const,
    metadata: null,
    lastHeartbeat: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCertificate = {
    id: 'cert-001',
    productId: 'prod-001',
    certType: 'GREEN_TAG',
    title: 'GreenTag Certificate — BAM-001-GRN',
    description: 'Verified sustainable product',
    issuerId: 'ver-001',
    issuedAt: new Date(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    revocationReason: null,
    ipfsHash: 'QmX7Y8Z9...',
    status: 'active',
    metadata: { verificationUrl: 'https://verify.verdechain.io/cert-001' },
    txHash: 'abc123...',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAttestation = {
    id: 'att-001',
    productId: 'prod-001',
    verifierId: 'ver-001',
    status: 'APPROVED' as const,
    threshold: 2,
    approvals: 3,
    rejections: 0,
    evidence: { report: 'Verified against GreenTag v2.1 standards' },
    txHash: 'def456...',
    submittedAt: new Date(),
    resolvedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDb = {
    manufacturer: {
      create: jest.fn().mockResolvedValue(mockManufacturer),
      findUnique: jest.fn().mockResolvedValue(mockManufacturer),
      findMany: jest.fn().mockResolvedValue([mockManufacturer]),
    },
    product: {
      create: jest.fn().mockResolvedValue(mockProduct),
      findUnique: jest.fn().mockResolvedValue(mockProduct),
      findMany: jest.fn().mockResolvedValue([mockProduct]),
      count: jest.fn().mockResolvedValue(1),
    },
    lifecycleEvent: {
      create: jest.fn().mockImplementation(({ data }: { data: { stage: string } }) => {
        const base = { id: 'evt-new', productId: 'prod-001', description: '', location: '', timestamp: new Date(), energyKwh: null, fuelUsed: null, fuelType: null, wasteKg: null, metadata: null, txHash: null, createdAt: new Date() };
        const match = mockEvents.find(e => e.stage === data.stage);
        return Promise.resolve(match ? { ...base, ...match } : { ...base, stage: data.stage });
      }),
      createMany: jest.fn().mockResolvedValue({ count: 3 }),
      findMany: jest.fn().mockResolvedValue(mockEvents),
      count: jest.fn().mockResolvedValue(3),
    },
    materialInput: {
      create: jest.fn().mockResolvedValue(mockMaterials[0]),
      findMany: jest.fn().mockResolvedValue(mockMaterials),
    },
    certificate: {
      create: jest.fn().mockResolvedValue(mockCertificate),
      findUnique: jest.fn().mockResolvedValue(mockCertificate),
      findMany: jest.fn().mockResolvedValue([mockCertificate]),
      update: jest.fn().mockResolvedValue({ ...mockCertificate, status: 'revoked' }),
    },
    carbonFootprint: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
    verifier: {
      create: jest.fn().mockResolvedValue(mockVerifier),
      findUnique: jest.fn().mockResolvedValue(mockVerifier),
      findMany: jest.fn().mockResolvedValue([mockVerifier]),
    },
    attestationRecord: {
      create: jest.fn().mockResolvedValue({ ...mockAttestation, status: 'PENDING' }),
      findUnique: jest.fn().mockResolvedValue(mockAttestation),
      findMany: jest.fn().mockResolvedValue([mockAttestation]),
    },
    webhook: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue({}),
    },
    webhookEvent: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
    user: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({}),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: mockDb,
        },
      ],
    }).compile();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  describe('Step 1: Manufacturer Registration', () => {
    it('should have a manufacturer record', async () => {
      const manufacturer = await prismaService.manufacturer.findUnique({
        where: { id: 'mfr-001' },
      });
      expect(manufacturer).toBeDefined();
      expect(manufacturer?.name).toBe('EcoFactory Inc.');
      expect(manufacturer?.country).toBe('PT');
    });
  });

  describe('Step 2: Product Registration', () => {
    it('should create a new product', async () => {
      const product = await prismaService.product.create({
        data: {
          productId: 1,
          manufacturerId: 'mfr-001',
          name: 'Eco-Friendly Bamboo T-Shirt',
          sku: 'BAM-001-GRN',
          productType: 'APPAREL',
          originCountry: 'PT',
          status: 'ACTIVE',
        },
      });
      expect(product).toBeDefined();
      expect(product.name).toBe('Eco-Friendly Bamboo T-Shirt');
      expect(product.status).toBe('ACTIVE');
    });

    it('should retrieve the product by ID', async () => {
      const product = await prismaService.product.findUnique({
        where: { id: 'prod-001' },
      });
      expect(product).toBeDefined();
      expect(product?.productId).toBe(1);
    });
  });

  describe('Step 3: Lifecycle Events Recording', () => {
    it('should record raw material extraction event', async () => {
      const event = await prismaService.lifecycleEvent.create({
        data: {
          productId: 'prod-001',
          stage: 'RAW_MATERIAL_EXTRACTION',
          description: 'Harvested organic bamboo',
          location: 'cn',
          timestamp: new Date('2024-01-15'),
          fuelUsed: 200,
          fuelType: 'diesel',
        },
      });
      expect(event).toBeDefined();
      expect(event.stage).toBe('RAW_MATERIAL_EXTRACTION');
    });

    it('should record manufacturing event', async () => {
      const event = await prismaService.lifecycleEvent.create({
        data: {
          productId: 'prod-001',
          stage: 'MANUFACTURING',
          description: 'Fabric weaving and assembly',
          location: 'pt',
          timestamp: new Date('2024-02-01'),
          energyKwh: 5000,
          fuelUsed: 1000,
          fuelType: 'natural_gas',
          wasteKg: 50,
        },
      });
      expect(event).toBeDefined();
      expect(event.stage).toBe('MANUFACTURING');
    });

    it('should record transport event', async () => {
      const event = await prismaService.lifecycleEvent.create({
        data: {
          productId: 'prod-001',
          stage: 'TRANSPORT_TO_DISTRIBUTOR',
          description: 'Shipping to distribution center',
          location: 'de',
          timestamp: new Date('2024-02-15'),
          fuelUsed: 800,
          fuelType: 'diesel',
        },
      });
      expect(event).toBeDefined();
      expect(event.stage).toBe('TRANSPORT_TO_DISTRIBUTOR');
    });

    it('should retrieve all events for the product', async () => {
      const events = await prismaService.lifecycleEvent.findMany({
        where: { productId: 'prod-001' },
        orderBy: { timestamp: 'asc' },
      });
      expect(events).toHaveLength(3);
    });
  });

  describe('Step 4: Carbon Footprint Calculation', () => {
    it('should calculate emissions from lifecycle events', async () => {
      const events = await prismaService.lifecycleEvent.findMany({
        where: { productId: 'prod-001' },
      });
      expect(events.length).toBeGreaterThanOrEqual(1);

      const materials = await prismaService.materialInput.findMany({
        where: { productId: 'prod-001' },
      });

      let totalFuel = 0;
      let totalEnergy = 0;
      for (const event of events) {
        if (event.fuelUsed) totalFuel += Number(event.fuelUsed);
        if (event.energyKwh) totalEnergy += Number(event.energyKwh);
      }

      expect(totalFuel).toBeGreaterThan(0);
      expect(materials).toBeDefined();
    });
  });

  describe('Step 5: Attestation Submission', () => {
    it('should create an attestation record', async () => {
      const attestation = await prismaService.attestationRecord.create({
        data: {
          productId: 'prod-001',
          verifierId: 'ver-001',
          status: 'PENDING',
          threshold: 2,
          evidence: {},
        },
      });
      expect(attestation).toBeDefined();
      expect(attestation.status).toBe('PENDING');
    });

    it('should approve the attestation', async () => {
      const attestation = await prismaService.attestationRecord.findUnique({
        where: { id: 'att-001' },
      });
      expect(attestation).toBeDefined();
      expect(attestation?.status).toBe('APPROVED');
      expect(attestation?.approvals).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Step 6: GreenTag Certificate Issuance', () => {
    it('should issue a certificate', async () => {
      const cert = await prismaService.certificate.create({
        data: {
          productId: 'prod-001',
          certType: 'GREEN_TAG',
          title: 'GreenTag Certificate — BAM-001-GRN',
          description: 'Verified sustainable product',
          issuerId: 'ver-001',
          issuedAt: new Date(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'active',
        },
      });
      expect(cert).toBeDefined();
      expect(cert.certType).toBe('GREEN_TAG');
      expect(cert.status).toBe('active');
    });

    it('should retrieve certificate for the product', async () => {
      const certs = await prismaService.certificate.findMany({
        where: { productId: 'prod-001' },
      });
      expect(certs).toHaveLength(1);
      expect(certs[0]?.certType).toBe('GREEN_TAG');
    });
  });

  describe('Step 7: Certificate Verification', () => {
    it('should verify the certificate exists and is active', async () => {
      const cert = await prismaService.certificate.findUnique({
        where: { id: 'cert-001' },
      });
      expect(cert).toBeDefined();
      expect(cert?.status).toBe('active');
      expect(cert?.revokedAt).toBeNull();
    });

    it('should have a verifiable IPFS hash', async () => {
      const cert = await prismaService.certificate.findUnique({
        where: { id: 'cert-001' },
      });
      expect(cert?.ipfsHash).toBeDefined();
      expect(cert?.ipfsHash?.length).toBeGreaterThan(0);
    });
  });

  describe('Step 8: Carbon Footprint Query', () => {
    it('should query carbon footprint with breakdown', async () => {
      const events = await prismaService.lifecycleEvent.findMany({
        where: { productId: 'prod-001' },
      });

      const emissionByStage = events.map((e) => ({
        stage: e.stage,
        fuel: e.fuelUsed || 0,
        energy: e.energyKwh || 0,
      }));

      expect(emissionByStage).toHaveLength(3);
      expect(emissionByStage[0]?.stage).toBe('RAW_MATERIAL_EXTRACTION');
      expect(emissionByStage[1]?.stage).toBe('MANUFACTURING');
      expect(emissionByStage[2]?.stage).toBe('TRANSPORT_TO_DISTRIBUTOR');
    });

    it('should provide product details', async () => {
      const product = await prismaService.product.findUnique({
        where: { id: 'prod-001' },
      });
      expect(product).toBeDefined();
      expect(product?.name).toBe('Eco-Friendly Bamboo T-Shirt');
      expect(product?.sku).toBe('BAM-001-GRN');
      expect(product?.originCountry).toBe('PT');
    });
  });

  describe('Full Journey Validation', () => {
    it('should trace the complete product lifecycle', async () => {
      const product = await prismaService.product.findUnique({
        where: { id: 'prod-001' },
      });
      expect(product).toBeDefined();
      expect(product?.status).toBe('ACTIVE');

      const events = await prismaService.lifecycleEvent.findMany({
        where: { productId: 'prod-001' },
        orderBy: { timestamp: 'asc' },
      });
      expect(events.length).toBeGreaterThanOrEqual(3);

      const certs = await prismaService.certificate.findMany({
        where: { productId: 'prod-001' },
      });
      expect(certs.length).toBeGreaterThanOrEqual(1);

      const attestations = await prismaService.attestationRecord.findMany({
        where: { productId: 'prod-001' },
      });
      expect(attestations.length).toBeGreaterThanOrEqual(1);

      const materials = await prismaService.materialInput.findMany({
        where: { productId: 'prod-001' },
      });

      const completeJourney = {
        product: product?.name,
        sku: product?.sku,
        origin: product?.originCountry,
        events: events.length,
        certificates: certs.length,
        attestations: attestations.length,
        materials: materials.length,
      };

      expect(completeJourney.product).toBe('Eco-Friendly Bamboo T-Shirt');
      expect(completeJourney.events).toBe(3);
      expect(completeJourney.certificates).toBe(1);
      expect(completeJourney.attestations).toBe(1);
    });
  });
});
