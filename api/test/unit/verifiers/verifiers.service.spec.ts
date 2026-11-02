import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VerifiersService } from '../../../src/verifiers/verifiers.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { StellarService } from '../../../src/stellar/stellar.service';
import { StakingService } from '../../../src/verifiers/staking.service';

describe('VerifiersService', () => {
  let service: VerifiersService;

  const mockPrisma = {
    verifier: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    attestationRecord: {
      findMany: jest.fn(),
    },
  };

  const mockStellar = {
    callContract: jest.fn(),
  };

  const mockStaking = {
    validateStake: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifiersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: StellarService,
          useValue: mockStellar,
        },
        {
          provide: StakingService,
          useValue: mockStaking,
        },
      ],
    }).compile();

    service = module.get<VerifiersService>(VerifiersService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw an error if stake validation fails', async () => {
      mockStaking.validateStake.mockReturnValue({
        valid: false,
        message: 'Minimum stake required: 10,000 XLM',
      });

      await expect(
        service.register({
          publicKey: 'GBRP...',
          name: 'Verifier Lab',
          stakeXlm: 100,
        }),
      ).rejects.toThrow('Minimum stake required: 10,000 XLM');
    });

    it('should register verifier successfully even if stellar contract call fails', async () => {
      mockStaking.validateStake.mockReturnValue({ valid: true });
      mockStellar.callContract.mockRejectedValue(new Error('Network offline'));
      mockPrisma.verifier.create.mockResolvedValue({
        id: 'ver-1',
        publicKey: 'GBRP...',
        name: 'Verifier Lab',
        stakeXlm: 10000,
        reputationScore: 0,
        status: 'ACTIVE',
      });

      const result = await service.register({
        publicKey: 'GBRP...',
        name: 'Verifier Lab',
        stakeXlm: 10000,
      });

      expect(mockStellar.callContract).toHaveBeenCalledWith('verifierRegistry', 'register_verifier');
      expect(mockPrisma.verifier.create).toHaveBeenCalled();
      expect(result.id).toBe('ver-1');
    });
  });

  describe('getProfile', () => {
    it('should throw NotFoundException when verifier does not exist', async () => {
      mockPrisma.verifier.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('ver-missing')).rejects.toThrow(NotFoundException);
    });

    it('should return verifier profile with attestation records', async () => {
      const mockVerifier = {
        id: 'ver-1',
        name: 'Verifier 1',
        attestationRecords: [{ id: 'att-1' }],
      };
      mockPrisma.verifier.findUnique.mockResolvedValue(mockVerifier);

      const result = await service.getProfile('ver-1');
      expect(result).toEqual(mockVerifier);
    });
  });

  describe('getPendingAttestations', () => {
    it('should throw NotFoundException if specific verifier id does not exist', async () => {
      mockPrisma.verifier.findUnique.mockResolvedValue(null);

      await expect(service.getPendingAttestations('ver-missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return pending attestations for a valid verifier id', async () => {
      mockPrisma.verifier.findUnique.mockResolvedValue({ id: 'ver-1' });
      mockPrisma.attestationRecord.findMany.mockResolvedValue([{ id: 'att-1', status: 'PENDING' }]);

      const result = await service.getPendingAttestations('ver-1');
      expect(mockPrisma.verifier.findUnique).toHaveBeenCalledWith({ where: { id: 'ver-1' } });
      expect(result).toHaveLength(1);
    });

    it('should return pending attestations without verifier lookup when id is omitted', async () => {
      mockPrisma.attestationRecord.findMany.mockResolvedValue([{ id: 'att-1', status: 'PENDING' }]);

      const result = await service.getPendingAttestations();
      expect(mockPrisma.verifier.findUnique).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('heartbeat', () => {
    it('should throw NotFoundException if verifier not found', async () => {
      mockPrisma.verifier.findUnique.mockResolvedValue(null);

      await expect(service.heartbeat('ver-missing')).rejects.toThrow(NotFoundException);
    });

    it('should update lastHeartbeat for existing verifier', async () => {
      mockPrisma.verifier.findUnique.mockResolvedValue({ id: 'ver-1' });
      mockPrisma.verifier.update.mockResolvedValue({
        id: 'ver-1',
        lastHeartbeat: new Date(),
      });

      const result = await service.heartbeat('ver-1');
      expect(mockPrisma.verifier.update).toHaveBeenCalledWith({
        where: { id: 'ver-1' },
        data: { lastHeartbeat: expect.any(Date) },
      });
      expect(result.id).toBe('ver-1');
    });
  });

  describe('findAll', () => {
    it('should return verifiers ordered by reputationScore', async () => {
      mockPrisma.verifier.findMany.mockResolvedValue([{ id: 'ver-1', reputationScore: 95 }]);

      const result = await service.findAll();
      expect(mockPrisma.verifier.findMany).toHaveBeenCalledWith({
        orderBy: { reputationScore: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('addStake', () => {
    it('should throw NotFoundException when verifier not found', async () => {
      mockPrisma.verifier.findUnique.mockResolvedValue(null);

      await expect(service.addStake('ver-missing', 5000)).rejects.toThrow(NotFoundException);
    });

    it('should increase verifier stake', async () => {
      mockPrisma.verifier.findUnique.mockResolvedValue({
        id: 'ver-1',
        stakeXlm: 10000,
      });
      mockPrisma.verifier.update.mockResolvedValue({
        id: 'ver-1',
        stakeXlm: 15000,
      });

      const result = await service.addStake('ver-1', 5000);
      expect(mockPrisma.verifier.update).toHaveBeenCalledWith({
        where: { id: 'ver-1' },
        data: { stakeXlm: 15000 },
      });
      expect(result.stakeXlm).toBe(15000);
    });
  });
});
