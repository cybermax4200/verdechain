import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const participants = [
  { name: 'Amazon Rainforest Reserve', publicKey: 'GA7QYNF7SOWQ3GLR2ZGMH7G7Y4S5XZ7Y6S5XZ7Y6S5ZJ', country: 'Brazil', role: 'raw_material' },
  { name: 'Green Logistics Ltd', publicKey: 'GB8RZNF7SOWQ3GLR2ZGMH7G7Y4S5XZ7Y6S5XZ7Y6S5ZK', country: 'Netherlands', role: 'logistics' },
  { name: 'EcoManufacture GmbH', publicKey: 'GC9SYNF7SOWQ3GLR2ZGMH7G7Y4S5XZ7Y6S5XZ7Y6S5ZL', country: 'Germany', role: 'manufacturer' },
  { name: 'Sustainable Distributors Inc', publicKey: 'GD0TZNF7SOWQ3GLR2ZGMH7G7Y4S5XZ7Y6S5XZ7Y6S5ZM', country: 'USA', role: 'distributor' },
  { name: 'EcoRetail Chain', publicKey: 'GE1UZNF7SOWQ3GLR2ZGMH7G7Y4S5XZ7Y6S5XZ7Y6S5ZN', country: 'UK', role: 'retailer' },
];

const supplyChainStages = [
  { stage: 'RAW_MATERIAL_EXTRACTION', description: 'Sustainable harvesting of raw rubber from managed forests', location: 'Manaus, Brazil' },
  { stage: 'TRANSPORT_TO_SUPPLIER', description: 'River barge transport to processing facility', location: 'Amazon River Basin' },
  { stage: 'MANUFACTURING', description: 'Processing into eco-friendly rubber sheets using solar-powered facility', location: 'Hamburg, Germany' },
  { stage: 'TRANSPORT_TO_DISTRIBUTOR', description: 'Ocean freight via wind-assisted cargo vessel', location: 'North Atlantic' },
  { stage: 'DISTRIBUTION', description: 'Warehousing and quality control at regional hub', location: 'Newark, NJ, USA' },
  { stage: 'RETAIL', description: 'Final product preparation for retail sale', location: 'London, UK' },
];

async function generate() {
  console.log('Generating demo supply chain...');

  const manufacturerRecord = await prisma.manufacturer.findFirst();
  if (!manufacturerRecord) {
    console.log('No manufacturer found. Please run seed-products.ts first.');
    await prisma.$disconnect();
    return;
  }

  const existing = await prisma.product.findUnique({ where: { productId: 100 } });
  if (existing) {
    console.log('Demo product already exists, skipping...');
    await prisma.$disconnect();
    return;
  }

  const product = await prisma.product.create({
    data: {
      productId: 100,
      manufacturerId: manufacturerRecord.id,
      name: 'Eco-Rubber Gasket (Demo Supply Chain)',
      description: 'A fully traceable eco-friendly rubber gasket demonstrating multi-hop supply chain tracking',
      sku: 'ERG-2024-DEMO',
      batchNumber: 'DEMO-CHAIN-001',
      productType: 'industrial',
      originCountry: 'Brazil',
      status: 'ACTIVE',
      metadata: {
        demoChain: true,
        participants: participants.map((p) => p.name),
        totalDistance: '~12,000 km',
      },
    },
  });

  console.log(`  Created demo product: ${product.name}`);

  for (let i = 0; i < supplyChainStages.length; i++) {
    const stage = supplyChainStages[i];
    const participant = participants[i % participants.length];

    await prisma.lifecycleEvent.create({
      data: {
        productId: product.id,
        stage: stage.stage as any,
        description: `[${participant.role}] ${stage.description}`,
        location: stage.location,
        timestamp: new Date(Date.now() - (supplyChainStages.length - i) * 3 * 86400000),
        energyKwh: 150 + Math.random() * 500,
        fuelUsed: i > 0 ? 50 + Math.random() * 200 : null,
        fuelType: i === 1 || i === 3 ? 'diesel' : 'natural_gas',
        wasteKg: Math.random() * 30,
        metadata: {
          participant: participant.name,
          participantPublicKey: participant.publicKey,
          role: participant.role,
          country: participant.country,
        },
      },
    });

    console.log(`    Stage ${i + 1}/${supplyChainStages.length}: ${stage.stage}`);
  }

  await prisma.carbonFootprint.create({
    data: {
      productId: product.id,
      scope1: 45.2,
      scope2: 120.8,
      scope3: 340.5,
      totalFootprint: 506.5,
      confidenceScore: 78,
      methodology: 'ghg_protocol',
      boundary: 'cradle-to-grave',
      breakdown: {
        rawMaterialExtraction: 120.3,
        transportToSupplier: 85.7,
        manufacturing: 180.5,
        transportToDistributor: 65.2,
        distribution: 34.8,
        retail: 20.0,
      },
    },
  });

  console.log(`  Carbon footprint calculated: 506.5 kg CO2e`);

  await prisma.certificate.create({
    data: {
      productId: product.id,
      certType: 'GREEN_TAG',
      title: 'GreenTag Certificate - Eco-Rubber Gasket',
      description: 'Verified sustainable supply chain certificate',
      issuerId: participant.publicKey,
      issuedAt: new Date(),
      status: 'active',
      metadata: {
        demoChain: true,
        methodology: 'GHG Protocol Scope 1, 2, 3',
        verificationStandard: 'ISO 14064',
      },
    },
  });

  console.log('  Certificate issued: GreenTag');
  console.log('Demo supply chain generation complete!');
  await prisma.$disconnect();
}

generate().catch((error) => {
  console.error('Demo generation failed:', error);
  prisma.$disconnect();
  process.exit(1);
});
