import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const verifiers = [
  {
    publicKey: 'GA7QYNF7SOWQ3GLR2ZGMH7G7Y4S5XZ7Y6S5XZ7Y6S5ZE',
    name: 'CarbonTrust Audit',
    email: 'audit@carbontrust.example.com',
    description: 'Independent carbon emissions verification body',
    stakeXlm: 5000,
  },
  {
    publicKey: 'GB8RZNF7SOWQ3GLR2ZGMH7G7Y4S5XZ7Y6S5XZ7Y6S5ZF',
    name: 'GreenTag Alliance',
    email: 'verify@greentagalliance.example.com',
    description: 'GreenTag certification verification specialist',
    stakeXlm: 10000,
  },
  {
    publicKey: 'GC9SYNF7SOWQ3GLR2ZGMH7G7Y4S5XZ7Y6S5XZ7Y6S5ZG',
    name: 'EcoCert International',
    email: 'info@ecocert.example.com',
    description: 'International sustainability certification body',
    stakeXlm: 7500,
  },
  {
    publicKey: 'GD0TZNF7SOWQ3GLR2ZGMH7G7Y4S5XZ7Y6S5XZ7Y6S5ZH',
    name: 'SupplyChain Integrity',
    email: 'hello@supplychainintegrity.example.com',
    description: 'Supply chain provenance and ethics verification',
    stakeXlm: 3000,
  },
  {
    publicKey: 'GE1UZNF7SOWQ3GLR2ZGMH7G7Y4S5XZ7Y6S5XZ7Y6S5ZI',
    name: 'Climate Neutral Group',
    email: 'certify@climateneutral.example.com',
    description: 'Climate neutrality and carbon offset verification',
    stakeXlm: 15000,
  },
];

async function seed() {
  console.log('Seeding verifiers...');

  for (const v of verifiers) {
    const existing = await prisma.verifier.findUnique({
      where: { publicKey: v.publicKey },
    });

    if (!existing) {
      await prisma.verifier.create({
        data: {
          ...v,
          reputationScore: Math.floor(Math.random() * 40) + 60,
          status: 'ACTIVE',
          lastHeartbeat: new Date(),
        },
      });
      console.log(`  Created verifier: ${v.name} (${v.stakeXlm} XLM staked)`);
    }
  }

  console.log('Verifier seeding complete!');
  await prisma.$disconnect();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  prisma.$disconnect();
  process.exit(1);
});
