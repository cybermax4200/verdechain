import { Injectable, NotFoundException, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StellarService } from '../stellar/stellar.service';
import { StakingService } from './staking.service';
import { RegisterVerifierDto } from './dto/register-verifier.dto';
import { WebhookService } from '../webhooks/webhook.service';

@Injectable()
export class VerifiersService {
  private readonly logger = new Logger(VerifiersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stellarService: StellarService,
    private readonly stakingService: StakingService,
    @Optional() private readonly webhookService?: WebhookService,
  ) {}

  async register(dto: RegisterVerifierDto) {
    const stakeValidation = this.stakingService.validateStake(dto.stakeXlm);
    if (!stakeValidation.valid) {
      throw new Error(stakeValidation.message);
    }

    try {
      await this.stellarService.callContract('verifierRegistry', 'register_verifier');
    } catch (error) {
      this.logger.warn(
        `Stellar contract call failed: ${error instanceof Error ? error.message : String(error)}`,
      );
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

  async getPendingAttestations(id?: string) {
    if (id) {
      const verifier = await this.prisma.verifier.findUnique({
        where: { id },
      });
      if (!verifier) {
        throw new NotFoundException('Verifier not found');
      }
    }

    const records = await this.prisma.attestationRecord.findMany({
      where: { status: 'PENDING' },
      include: { product: true },
      orderBy: { submittedAt: 'asc' },
      take: 50,
    });

    return records.map((record: any) => ({
      ...record,
      productName: record.product?.name ?? record.productName ?? 'Unknown Product',
      manufacturer:
        record.product?.manufacturerId ??
        record.manufacturer ??
        'Unknown',
      verifierCount: record.approvals ?? 0,
      requiredCount: record.threshold ?? 2,
    }));
  }

  async submitAttestation(productId: string, evidence?: any, threshold = 2) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let txHash: string | null = null;
    if (this.stellarService?.isConfigured('attestation')) {
      try {
        const callerScVal = this.stellarService.toAddressScVal();
        const productIdScVal = this.stellarService.toU64ScVal(product.productId || 1);
        txHash = await this.stellarService.callContract('attestation', 'submit_for_attestation', [
          callerScVal,
          productIdScVal,
        ]);
      } catch (err) {
        this.logger.warn(
          `On-chain attestation submission skipped: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    const attestation = await this.prisma.attestationRecord.create({
      data: {
        productId,
        threshold,
        status: 'PENDING',
        evidence: evidence ?? null,
        txHash,
      },
      include: { product: true },
    });

    if (this.webhookService) {
      this.webhookService
        .dispatch('attestation.submitted', { attestation })
        .catch((err) => this.logger.warn(`Webhook dispatch error: ${err}`));
    }

    return attestation;
  }

  async approveAttestation(id: string, verifierId?: string) {
    const record = await this.prisma.attestationRecord.findUnique({
      where: { id },
      include: { product: true },
    });
    if (!record) {
      throw new NotFoundException('Attestation record not found');
    }

    const newApprovals = record.approvals + 1;
    const isApproved = newApprovals >= record.threshold;
    const status = isApproved ? 'APPROVED' : record.status;

    let txHash = record.txHash;
    if (this.stellarService?.isConfigured('attestation')) {
      try {
        const callerScVal = this.stellarService.toAddressScVal(verifierId);
        const attIdScVal = this.stellarService.toU64ScVal(1);
        txHash = await this.stellarService.callContract('attestation', 'approve_attestation', [
          callerScVal,
          attIdScVal,
        ]);
      } catch (err) {
        this.logger.warn(
          `On-chain attestation approval skipped: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    const updated = await this.prisma.attestationRecord.update({
      where: { id },
      data: {
        approvals: newApprovals,
        status,
        txHash: txHash ?? record.txHash,
        resolvedAt: isApproved ? new Date() : null,
      },
    });

    if (verifierId) {
      await this.prisma.verifier
        .update({
          where: { id: verifierId },
          data: {
            reputationScore: { increment: 5 },
            lastHeartbeat: new Date(),
          },
        })
        .catch(() => {});
    }

    if (this.webhookService) {
      this.webhookService
        .dispatch(isApproved ? 'attestation.approved' : 'attestation.vote_recorded', {
          attestation: updated,
        })
        .catch((err) => this.logger.warn(`Webhook dispatch error: ${err}`));
    }

    return updated;
  }

  async rejectAttestation(id: string, reason?: string, verifierId?: string) {
    const record = await this.prisma.attestationRecord.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException('Attestation record not found');
    }

    const updated = await this.prisma.attestationRecord.update({
      where: { id },
      data: {
        rejections: { increment: 1 },
        status: 'REJECTED',
        resolvedAt: new Date(),
      },
    });

    if (this.webhookService) {
      this.webhookService
        .dispatch('attestation.rejected', { attestation: updated, reason, verifierId })
        .catch((err) => this.logger.warn(`Webhook dispatch error: ${err}`));
    }

    return updated;
  }

  async escalateAttestation(id: string, reason?: string, verifierId?: string) {
    const record = await this.prisma.attestationRecord.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException('Attestation record not found');
    }

    const updated = await this.prisma.attestationRecord.update({
      where: { id },
      data: {
        status: 'ESCALATED',
        threshold: { increment: 2 },
      },
    });

    if (this.webhookService) {
      this.webhookService
        .dispatch('attestation.escalated', { attestation: updated, reason, verifierId })
        .catch((err) => this.logger.warn(`Webhook dispatch error: ${err}`));
    }

    return updated;
  }

  async getAttestation(id: string) {
    const record = await this.prisma.attestationRecord.findUnique({
      where: { id },
      include: { product: true, verifier: true },
    });
    if (!record) {
      throw new NotFoundException('Attestation record not found');
    }
    return record;
  }

  async getAttestationsByProduct(productId: string) {
    return this.prisma.attestationRecord.findMany({
      where: { productId },
      include: { verifier: true },
      orderBy: { submittedAt: 'desc' },
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
