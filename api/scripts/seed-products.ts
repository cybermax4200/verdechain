import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const manufacturers = [
  {
    name: 'EcoFab Textiles',
    publicKey: 'GA7QYNF7SOWQ3GLR2ZGMH7G7Y4S5XZ7Y6S5XZ7Y6S5XZ',
    country: 'Portugal',
  },
  {
    name: 'GreenSteel Corp',
    publicKey: 'GB8RZNF7SOWQ3GLR2ZGMH7G7Y4S5XZ7Y6S5XZ7Y6S5YA',
    country: 'Sweden',
  },
  {
    name: 'PurePack Solutions',
    publicKey: 'GC9SYNF7SOWQ3GLR2ZGMH7G7Y4S5XZ7Y6S5XZ7Y6S5YB',
    country: 'Germany',
  },
  {
    name: 'BioMaterials Inc',
    publicKey: 'GD0TZNF7SOWQ3GLR2ZGMH7G7Y4S5XZ7Y6S5XZ7Y6S5YC',
    country: 'Canada',
  },
  {
    name: 'SunCell Energy',
    publicKey: 'GE1UZNF7SOWQ3GLR2ZGMH7G7Y4S5XZ7Y6S5XZ7Y6S5YD',
    country: 'USA',
  },
];

const products = [
  {
    name: 'Organic Cotton T-Shirt',
    sku: 'OCT-2024-001',
    batchNumber: 'BATCH-A1',
    productType: 'apparel',
    originCountry: 'Portugal',
  },
  {
    name: 'Recycled Steel Beam',
    sku: 'RSB-2024-002',
    batchNumber: 'BATCH-B2',
    productType: 'construction',
    originCountry: 'Sweden',
  },
  {
    name: 'Biodegradable Food Container',
    sku: 'BFC-2024-003',
    batchNumber: 'BATCH-C3',
    productType: 'packaging',
    originCountry: 'Germany',
  },
  {
    name: 'Bamboo Fiber Sheet Set',
    sku: 'BFS-2024-004',
    batchNumber: 'BATCH-D4',
    productType: 'home',
    originCountry: 'Canada',
  },
  {
    name: 'Solar Panel 400W',
    sku: 'SP-2024-005',
    batchNumber: 'BATCH-E5',
    productType: 'electronics',
    originCountry: 'USA',
  },
  {
    name: 'Hemp Rope 50m',
    sku: 'HR-2024-006',
    batchNumber: 'BATCH-F6',
    productType: 'goods',
    originCountry: 'Portugal',
  },
  {
    name: 'Aluminum Can (Recycled)',
    sku: 'AC-2024-007',
    batchNumber: 'BATCH-G7',
    productType: 'packaging',
    originCountry: 'Sweden',
  },
  {
    name: 'Wool Blanket',
    sku: 'WB-2024-008',
    batchNumber: 'BATCH-H8',
    productType: 'home',
    originCountry: 'Canada',
  },
  {
    name: 'Lithium Battery 12V',
    sku: 'LB-2024-009',
    batchNumber: 'BATCH-I9',
    productType: 'electronics',
    originCountry: 'Germany',
  },
  {
    name: 'Compostable Cutlery Set',
    sku: 'CC-2024-010',
    batchNumber: 'BATCH-J10',
    productType: 'packaging',
    originCountry: 'USA',
  },
];

async function seed() {
  console.log('Seeding products...');

  for (let i = 0; i < manufacturers.length; i++) {
    const mfr = manufacturers[i]!;
    const existing = await prisma.manufacturer.findUnique({ where: { publicKey: mfr.publicKey } });
    if (!existing) {
      await prisma.manufacturer.create({ data: mfr });
      console.log(`  Created manufacturer: ${mfr.name}`);
    }
  }

  for (let i = 0; i < products.length; i++) {
    const prod = products[i]!;
    const mfrIndex = i % manufacturers.length;
    const manufacturer = await prisma.manufacturer.findUnique({
      where: { publicKey: manufacturers[mfrIndex]!.publicKey },
    });
    if (!manufacturer) continue;

    const existing = await prisma.product.findUnique({ where: { productId: i + 1 } });
    if (!existing) {
      await prisma.product.create({
        data: {
          productId: i + 1,
          manufacturerId: manufacturer.id,
          name: prod.name,
          description: `High-quality ${prod.productType} product with sustainable practices`,
          sku: prod.sku,
          batchNumber: prod.batchNumber,
          productType: prod.productType,
          originCountry: prod.originCountry,
          status: 'ACTIVE',
          metadata: {
            carbonFootprint: { estimated: true, scope: 'cradle-to-gate' },
            certifications: [],
          },
        },
      });
      console.log(`  Created product: ${prod.name}`);

      const stages = [
        'RAW_MATERIAL_EXTRACTION',
        'TRANSPORT_TO_SUPPLIER',
        'MANUFACTURING',
        'DISTRIBUTION',
      ];
      for (let s = 0; s < stages.length; s++) {
        await prisma.lifecycleEvent.create({
          data: {
            productId: (await prisma.product.findUnique({ where: { productId: i + 1 } }))!.id,
            stage: stages[s]! as any,
            description: `${stages[s]!.replace(/_/g, ' ').toLowerCase()} stage for ${prod.name}`,
            timestamp: new Date(Date.now() - (stages.length - s) * 7 * 86400000),
            energyKwh: Math.random() * 1000 + 100,
            wasteKg: Math.random() * 50 + 5,
          },
        });
      }
    }
  }

  console.log('Product seeding complete!');
  await prisma.$disconnect();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  prisma.$disconnect();
  process.exit(1);
});
