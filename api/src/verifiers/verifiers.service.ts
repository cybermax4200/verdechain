import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StellarService } from '../stellar/stellar.service';
import { StakingService } from './staking.service';
import { RegisterVerifierDto } from './dto/register-verifier.dto';

@Injectable()
export class VerifiersService {
  private readonly logger = new Logger(VerifiersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stellarService: StellarService,
    private readonly stakingService: StakingService,
  ) {}

  async register(dto: RegisterVerifierDto) {
    const stakeValidation = this.stakingService.validateStake(dto.stakeXlm);
    if (!stakeValidation.valid) {
      throw new Error(stakeValidation.message);
    }

    try {
      await this.stellarService.callContract('verifierRegistry', 'register_verifier');
    } catch (error) {
      this.logger.warn(`Stellar contract call failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    const verifier = await this.prisma.verifier.create({
      data: {
        publicKey: dto.publicKey,
        name: dto.name,
        email: dto.email ?? null,
        description: dto.description ?? null,
        stakeXlm: dto.stakeXlm,
        reputationScore: 0,
        status: 'ACTIVE',
      },
    });

    return verifier;
  }

  async getProfile(id: string) {
    const verifier = await this.prisma.verifier.findUnique({
      where: { id },
      include: {
        attestationRecords: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!verifier) {
      throw new NotFoundException('Verifier not found');
    }

    return verifier;
  }

  async getPendingAttestations(id: string) {
    const verifier = await this.prisma.verifier.findUnique({
      where: { id },
    });
    if (!verifier) {
      throw new NotFoundException('Verifier not found');
    }

    return this.prisma.attestationRecord.findMany({
      where: { status: 'PENDING' },
      include: { product: true },
      orderBy: { submittedAt: 'asc' },
      take: 50,
    });
  }

  async heartbeat(id: string) {
    const verifier = await this.prisma.verifier.findUnique({
      where: { id },
    });
    if (!verifier) {
      throw new NotFoundException('Verifier not found');
    }

    const updated = await this.prisma.verifier.update({
      where: { id },
      data: { lastHeartbeat: new Date() },
    });

    return updated;
  }

  async findAll() {
    return this.prisma.verifier.findMany({
      orderBy: { reputationScore: 'desc' },
    });
  }

  async addStake(id: string, amount: number) {
    const verifier = await this.prisma.verifier.findUnique({
      where: { id },
    });
    if (!verifier) {
      throw new NotFoundException('Verifier not found');
    }

    const newStake = verifier.stakeXlm + amount;
    const updated = await this.prisma.verifier.update({
      where: { id },
      data: { stakeXlm: newStake },
    });

    return updated;
  }
}
