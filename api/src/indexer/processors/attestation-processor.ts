import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type AttestationEventType =
  | 'AttestationRequested'
  | 'AttestationApproved'
  | 'AttestationRejected'
  | 'AttestationEscalated';

export interface AttestationEvent {
  type: AttestationEventType;
  productId: string;
  attestationId: string;
  data: Record<string, unknown>;
  txHash: string;
  ledger: number;
  timestamp: Date;
}

@Injectable()
export class AttestationProcessor {
  private readonly logger = new Logger(AttestationProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  async process(event: AttestationEvent): Promise<void> {
    this.logger.log(`Processing ${event.type} for attestation ${event.attestationId}`);

    switch (event.type) {
      case 'AttestationRequested':
        await this.handleRequested(event);
        break;
      case 'AttestationApproved':
        await this.handleApproved(event);
        break;
      case 'AttestationRejected':
        await this.handleRejected(event);
        break;
      case 'AttestationEscalated':
        await this.handleEscalated(event);
        break;
    }
  }

  private async handleRequested(event: AttestationEvent): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { productId: parseInt(event.productId, 10) },
    });

    if (!product) {
      this.logger.warn(`Product ${event.productId} not found for attestation`);
      return;
    }

    await this.prisma.attestationRecord.create({
      data: {
        productId: product.id,
        verifierId: (event.data['verifierId'] as string) ?? null,
        status: 'PENDING',
        threshold: (event.data['threshold'] as number) ?? 2,
        evidence: event.data as any,
        txHash: event.txHash,
        submittedAt: event.timestamp,
      },
    });

    this.logger.log(`Attestation requested for product ${event.productId}`);
  }

  private async handleApproved(event: AttestationEvent): Promise<void> {
    const record = await this.findAttestation(event.attestationId, event.productId);
    if (!record) return;

    const newApprovals = record.approvals + 1;
    const status = newApprovals >= record.threshold ? 'APPROVED' : 'PENDING';

    await this.prisma.attestationRecord.update({
      where: { id: record.id },
      data: {
        approvals: newApprovals,
        status,
        resolvedAt: status === 'APPROVED' ? event.timestamp : null,
      },
    });

    this.logger.log(`Attestation ${record.id} approved (${newApprovals}/${record.threshold})`);
  }

  private async handleRejected(event: AttestationEvent): Promise<void> {
    const record = await this.findAttestation(event.attestationId, event.productId);
    if (!record) return;

    const newRejections = record.rejections + 1;
    await this.prisma.attestationRecord.update({
      where: { id: record.id },
      data: {
        rejections: newRejections,
        status: 'REJECTED',
        resolvedAt: event.timestamp,
      },
    });

    this.logger.log(`Attestation ${record.id} rejected`);
  }

  private async handleEscalated(event: AttestationEvent): Promise<void> {
    const record = await this.findAttestation(event.attestationId, event.productId);
    if (!record) return;

    await this.prisma.attestationRecord.update({
      where: { id: record.id },
      data: {
        status: 'ESCALATED',
        threshold: (event.data['newThreshold'] as number) ?? 5,
      },
    });

    this.logger.log(`Attestation ${record.id} escalated`);
  }

  private async findAttestation(attestationId: string, productId: string) {
    if (attestationId) {
      return this.prisma.attestationRecord.findFirst({
        where: { txHash: attestationId },
      });
    }

    const product = await this.prisma.product.findUnique({
      where: { productId: parseInt(productId, 10) },
    });

    if (!product) return null;

    return this.prisma.attestationRecord.findFirst({
      where: { productId: product.id },
      orderBy: { createdAt: 'desc' },
    });
  }
}
