import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CertificateEvent {
  type: 'GreenTagIssued' | 'GreenTagRevoked';
  productId: string;
  certificateId: string;
  data: Record<string, unknown>;
  txHash: string;
  ledger: number;
  timestamp: Date;
}

@Injectable()
export class CertificateProcessor {
  private readonly logger = new Logger(CertificateProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  async process(event: CertificateEvent): Promise<void> {
    this.logger.log(`Processing ${event.type} for certificate ${event.certificateId}`);

    switch (event.type) {
      case 'GreenTagIssued':
        await this.handleIssued(event);
        break;
      case 'GreenTagRevoked':
        await this.handleRevoked(event);
        break;
    }
  }

  private async handleIssued(event: CertificateEvent): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { productId: parseInt(event.productId, 10) },
    });

    if (!product) {
      this.logger.warn(`Product ${event.productId} not found for certificate issuance`);
      return;
    }

    await this.prisma.certificate.create({
      data: {
        productId: product.id,
        certType: ((event.data['certType'] as string) ?? 'GREEN_TAG') as any,
        title: (event.data['title'] as string) ?? `GreenTag Certificate - ${event.productId}`,
        description: (event.data['description'] as string) ?? null,
        issuerId: (event.data['issuerId'] as string) ?? null,
        issuedAt: event.timestamp,
        ipfsHash: (event.data['ipfsHash'] as string) ?? null,
        txHash: event.txHash,
        status: 'active',
      },
    });

    this.logger.log(`Certificate issued for product ${event.productId}`);
  }

  private async handleRevoked(event: CertificateEvent): Promise<void> {
    const certificate = await this.prisma.certificate.findFirst({
      where: { txHash: event.txHash },
    });

    if (!certificate) {
      this.logger.warn(`Certificate ${event.certificateId} not found for revocation`);
      return;
    }

    await this.prisma.certificate.update({
      where: { id: certificate.id },
      data: {
        status: 'revoked',
        revokedAt: event.timestamp,
        revocationReason: (event.data['reason'] as string) ?? 'Revoked on-chain',
      },
    });

    this.logger.log(`Certificate ${certificate.id} revoked`);
  }
}
