import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../../../src/health/health.controller';
import { PrismaService } from '../../../src/prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should return ok when database is reachable', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

    const result = await controller.check();
    expect(result.status).toBe('ok');
    expect(result.database).toBe('ok');
    expect(result.version).toBe('1.0.0');
    expect(typeof result.uptime).toBe('number');
    expect(result.timestamp).toBeDefined();
  });

  it('should return degraded when database fails to respond', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

    const result = await controller.check();
    expect(result.status).toBe('degraded');
    expect(result.database).toBe('disconnected');
  });
});
