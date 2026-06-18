import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IndexerService } from './indexer.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly indexerService: IndexerService,
  ) {}

  async resyncFrom(ledger: number): Promise<void> {
    this.logger.log(`Starting resync from ledger ${ledger}`);

    await this.prisma.lifecycleEvent.deleteMany({});
    await this.prisma.attestationRecord.deleteMany({});
    await this.prisma.certificate.updateMany({
      data: { status: 'unknown' },
    });

    this.logger.log('Cleared indexed data, starting re-index...');

    try {
      await this.indexerService.processLedger(ledger);
      this.logger.log(`Resync from ledger ${ledger} completed`);
    } catch (error) {
      this.logger.error(`Resync failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async verifyConsistency(): Promise<{ valid: boolean; issues: string[] }> {
    this.logger.log('Verifying index consistency...');
    const issues: string[] = [];

    const totalProducts = await this.prisma.product.count();
    const totalEvents = await this.prisma.lifecycleEvent.count();
    const totalAttestations = await this.prisma.attestationRecord.count();
    const totalCertificates = await this.prisma.certificate.count();

    this.logger.log(
      `Products: ${totalProducts}, Events: ${totalEvents}, Attestations: ${totalAttestations}, Certificates: ${totalCertificates}`,
    );

    if (totalEvents > 0) {
      const orphanEvents = await this.prisma.lifecycleEvent.findMany({
        where: {
          productId: {
            notIn: (await this.prisma.product.findMany({ select: { id: true } })).map((p) => p.id),
          },
        },
        take: 10,
      });

      if (orphanEvents.length > 0) {
        issues.push(`Found ${orphanEvents.length} lifecycle events with missing products`);
      }
    }

    if (totalAttestations > 0) {
      const orphanAttestations = await this.prisma.attestationRecord.findMany({
        where: {
          productId: {
            notIn: (await this.prisma.product.findMany({ select: { id: true } })).map((p) => p.id),
          },
        },
        take: 10,
      });

      if (orphanAttestations.length > 0) {
        issues.push(`Found ${orphanAttestations.length} attestations with missing products`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
