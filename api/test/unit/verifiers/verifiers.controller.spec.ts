import { Test, TestingModule } from '@nestjs/testing';
import { VerifiersController } from '../../../src/verifiers/verifiers.controller';
import { VerifiersService } from '../../../src/verifiers/verifiers.service';

describe('VerifiersController', () => {
  let controller: VerifiersController;
  let service: VerifiersService;

  const mockService = {
    register: jest.fn(),
    findAll: jest.fn(),
    getPendingAttestations: jest.fn(),
    getProfile: jest.fn(),
    addStake: jest.fn(),
    heartbeat: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VerifiersController],
      providers: [
        {
          provide: VerifiersService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<VerifiersController>(VerifiersController);
    service = module.get<VerifiersService>(VerifiersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should delegate registration to service', async () => {
      const dto = {
        publicKey: 'GBRP...',
        name: 'Carbon Audit Lab',
        email: 'lab@example.com',
        stakeXlm: 10000,
      };
      mockService.register.mockResolvedValue({ id: 'ver-1', ...dto });

      const result = await controller.register(dto);
      expect(service.register).toHaveBeenCalledWith(dto);
      expect(result.id).toBe('ver-1');
    });
  });

  describe('findAll', () => {
    it('should return all verifiers', async () => {
      mockService.findAll.mockResolvedValue([{ id: 'ver-1', name: 'Verifier 1' }]);

      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('getPendingAttestations', () => {
    it('should delegate query with verifierId when provided', async () => {
      mockService.getPendingAttestations.mockResolvedValue([{ id: 'att-1' }]);

      const result = await controller.getPendingAttestations('ver-1');
      expect(service.getPendingAttestations).toHaveBeenCalledWith('ver-1');
      expect(result).toHaveLength(1);
    });

    it('should delegate query with undefined when verifierId is omitted', async () => {
      mockService.getPendingAttestations.mockResolvedValue([]);

      const result = await controller.getPendingAttestations(undefined);
      expect(service.getPendingAttestations).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([]);
    });
  });

  describe('getProfile', () => {
    it('should return profile for given id', async () => {
      mockService.getProfile.mockResolvedValue({ id: 'ver-1', name: 'Profile' });

      const result = await controller.getProfile('ver-1');
      expect(service.getProfile).toHaveBeenCalledWith('ver-1');
      expect(result.id).toBe('ver-1');
    });
  });

  describe('addStake', () => {
    it('should delegate adding stake to service', async () => {
      mockService.addStake.mockResolvedValue({ id: 'ver-1', stakeXlm: 15000 });

      const result = await controller.addStake('ver-1', 5000);
      expect(service.addStake).toHaveBeenCalledWith('ver-1', 5000);
      expect(result.stakeXlm).toBe(15000);
    });
  });

  describe('heartbeat', () => {
    it('should delegate heartbeat call to service', async () => {
      mockService.heartbeat.mockResolvedValue({ id: 'ver-1', lastHeartbeat: new Date() });

      const result = await controller.heartbeat('ver-1');
      expect(service.heartbeat).toHaveBeenCalledWith('ver-1');
      expect(result.id).toBe('ver-1');
    });
  });
});
