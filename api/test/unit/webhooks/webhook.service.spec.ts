import { Test, TestingModule } from '@nestjs/testing';
import { WebhookService } from '../../../src/webhooks/webhook.service';
import { PrismaService } from '../../../src/prisma/prisma.service';

describe('WebhookService', () => {
  let service: WebhookService;

  const mockPrisma = {
    webhook: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    webhookEvent: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const originalFetch = global.fetch;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('sign', () => {
    it('should generate valid HMAC-SHA256 signature', () => {
      const signature = service.sign('{"hello":"world"}', 'my-secret');
      expect(typeof signature).toBe('string');
      expect(signature).toHaveLength(64);
    });
  });

  describe('register', () => {
    it('should create an active webhook record', async () => {
      const mockRecord = {
        id: 'wh-1',
        url: 'https://example.com/hook',
        events: ['product.created'],
        secret: 'whsec_abc',
        active: true,
      };
      mockPrisma.webhook.create.mockResolvedValue(mockRecord);

      const result = await service.register(
        'https://example.com/hook',
        ['product.created'],
        'whsec_abc',
      );
      expect(mockPrisma.webhook.create).toHaveBeenCalledWith({
        data: {
          url: 'https://example.com/hook',
          events: ['product.created'],
          secret: 'whsec_abc',
          active: true,
        },
      });
      expect(result).toEqual(mockRecord);
    });
  });

  describe('findAll', () => {
    it('should query webhooks ordered by createdAt desc', async () => {
      mockPrisma.webhook.findMany.mockResolvedValue([{ id: 'wh-1' }]);

      const result = await service.findAll();
      expect(mockPrisma.webhook.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('remove', () => {
    it('should cascade delete webhookEvents and remove webhook', async () => {
      mockPrisma.webhookEvent.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.webhook.delete.mockResolvedValue({ id: 'wh-1' });

      await service.remove('wh-1');
      expect(mockPrisma.webhookEvent.deleteMany).toHaveBeenCalledWith({
        where: { webhookId: 'wh-1' },
      });
      expect(mockPrisma.webhook.delete).toHaveBeenCalledWith({
        where: { id: 'wh-1' },
      });
    });
  });

  describe('findEvents', () => {
    it('should return recent events for webhook', async () => {
      mockPrisma.webhookEvent.findMany.mockResolvedValue([{ id: 'evt-1' }]);

      const result = await service.findEvents('wh-1');
      expect(mockPrisma.webhookEvent.findMany).toHaveBeenCalledWith({
        where: { webhookId: 'wh-1' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('dispatch', () => {
    it('should return early if no webhooks are registered for event', async () => {
      mockPrisma.webhook.findMany.mockResolvedValue([]);
      global.fetch = jest.fn();

      await service.dispatch('product.deleted', { id: 'p-1' });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should send webhook and record delivered event when response is ok', async () => {
      mockPrisma.webhook.findMany.mockResolvedValue([
        { id: 'wh-1', url: 'https://webhook.site/test', secret: 'whsec_123' },
      ]);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

      await service.dispatch('product.created', { id: 'p-1' });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://webhook.site/test',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Webhook-Signature': expect.any(String),
          }),
        }),
      );
      expect(mockPrisma.webhookEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            webhookId: 'wh-1',
            eventType: 'product.created',
            status: 'delivered',
          }),
        }),
      );
    });

    it('should record failed event and schedule retry when HTTP response is not ok', async () => {
      mockPrisma.webhook.findMany.mockResolvedValue([
        { id: 'wh-1', url: 'https://webhook.site/test', secret: 'whsec_123' },
      ]);
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await service.dispatch('product.created', { id: 'p-1' });

      expect(mockPrisma.webhookEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            webhookId: 'wh-1',
            status: 'failed',
          }),
        }),
      );
      expect(mockPrisma.webhookEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            webhookId: 'wh-1',
            status: 'pending_retry',
          }),
        }),
      );
    });
  });

  describe('retry', () => {
    beforeEach(() => {
      jest.spyOn(global, 'setTimeout').mockImplementation((cb: any) => {
        cb();
        return 0 as any;
      });
    });

    it('should throw error if event not found', async () => {
      mockPrisma.webhookEvent.findUnique.mockResolvedValue(null);

      await expect(service.retry('evt-missing')).rejects.toThrow(
        'Webhook event evt-missing not found',
      );
    });

    it('should throw error if webhook is deactivated', async () => {
      mockPrisma.webhookEvent.findUnique.mockResolvedValue({
        id: 'evt-1',
        webhook: { active: false },
      });

      await expect(service.retry('evt-1')).rejects.toThrow('Webhook is deactivated');
    });

    it('should throw error if max retry attempts exceeded', async () => {
      mockPrisma.webhookEvent.findUnique.mockResolvedValue({
        id: 'evt-1',
        attempts: 3,
        webhook: { active: true },
      });

      await expect(service.retry('evt-1')).rejects.toThrow('Max retry attempts exceeded');
    });

    it('should successfully deliver retry and update event', async () => {
      mockPrisma.webhookEvent.findUnique.mockResolvedValue({
        id: 'evt-1',
        attempts: 1,
        payload: { eventType: 'test', timestamp: new Date() },
        webhook: { id: 'wh-1', active: true, url: 'https://example.com', secret: 'secret' },
      });
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

      await service.retry('evt-1');

      expect(mockPrisma.webhookEvent.update).toHaveBeenCalledWith({
        where: { id: 'evt-1' },
        data: {
          status: 'delivered',
          attempts: { increment: 1 },
        },
      });
    });
  });
});
