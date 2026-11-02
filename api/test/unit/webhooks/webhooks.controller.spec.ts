import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksController } from '../../../src/webhooks/webhooks.controller';
import { WebhookService } from '../../../src/webhooks/webhook.service';

describe('WebhooksController', () => {
  let controller: WebhooksController;
  let service: WebhookService;

  const mockService = {
    register: jest.fn(),
    findAll: jest.fn(),
    remove: jest.fn(),
    dispatch: jest.fn(),
    findEvents: jest.fn(),
    retry: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        {
          provide: WebhookService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<WebhooksController>(WebhooksController);
    service = module.get<WebhookService>(WebhookService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a webhook with url, events, and secret', async () => {
      const dto = {
        url: 'https://example.com/webhook',
        events: ['product.created', 'lifecycle.event'],
        secret: 'whsec_123',
      };
      mockService.register.mockResolvedValue({ id: 'wh-1', ...dto, active: true });

      const result = await controller.register(dto);
      expect(service.register).toHaveBeenCalledWith(dto.url, dto.events, dto.secret);
      expect(result.id).toBe('wh-1');
    });
  });

  describe('findAll', () => {
    it('should return all registered webhooks', async () => {
      mockService.findAll.mockResolvedValue([{ id: 'wh-1' }, { id: 'wh-2' }]);

      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('remove', () => {
    it('should remove webhook by id', async () => {
      mockService.remove.mockResolvedValue({ id: 'wh-1' });

      await controller.remove('wh-1');
      expect(service.remove).toHaveBeenCalledWith('wh-1');
    });
  });

  describe('test', () => {
    it('should dispatch test webhook event', async () => {
      mockService.dispatch.mockResolvedValue(undefined);

      const result = await controller.test('wh-1');
      expect(service.dispatch).toHaveBeenCalledWith(
        'webhook.test',
        expect.objectContaining({
          webhookId: 'wh-1',
          message: 'This is a test webhook event',
        }),
      );
      expect(result.message).toBe('Test event dispatched');
    });
  });

  describe('getEvents', () => {
    it('should return events for webhook id', async () => {
      mockService.findEvents.mockResolvedValue([{ id: 'evt-1' }]);

      const result = await controller.getEvents('wh-1');
      expect(service.findEvents).toHaveBeenCalledWith('wh-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('retryEvent', () => {
    it('should initiate retry for event id', async () => {
      mockService.retry.mockResolvedValue(undefined);

      const result = await controller.retryEvent('evt-1');
      expect(service.retry).toHaveBeenCalledWith('evt-1');
      expect(result.message).toBe('Retry initiated');
    });
  });
});
