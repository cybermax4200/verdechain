import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HorizonClientService } from '../stellar/horizon-client';
import { PrismaService } from '../prisma/prisma.service';
import { ProductProcessor, ProductEvent } from './processors/product-processor';
import { LifecycleProcessor, LifecycleEvent } from './processors/lifecycle-processor';
import { AttestationProcessor, AttestationEvent } from './processors/attestation-processor';
import { CertificateProcessor, CertificateEvent } from './processors/certificate-processor';
import { VerifierProcessor, VerifierEvent } from './processors/verifier-processor';

export type IndexerEvent =
  | ProductEvent
  | LifecycleEvent
  | AttestationEvent
  | CertificateEvent
  | VerifierEvent;

@Injectable()
export class IndexerService implements OnModuleInit {
  private readonly logger = new Logger(IndexerService.name);
  private isRunning = false;
  private currentCursor: string | null = null;
  private pollIntervalMs = 5000;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly horizonClient: HorizonClientService,
    private readonly prisma: PrismaService,
    private readonly productProcessor: ProductProcessor,
    private readonly lifecycleProcessor: LifecycleProcessor,
    private readonly attestationProcessor: AttestationProcessor,
    private readonly certificateProcessor: CertificateProcessor,
    private readonly verifierProcessor: VerifierProcessor,
  ) {}

  async onModuleInit(): Promise<void> {
    this.currentCursor = await this.loadLastProcessedLedger();
    this.logger.log(`Indexer initialized with cursor: ${this.currentCursor ?? 'genesis'}`);
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Indexer is already running');
      return;
    }

    this.isRunning = true;
    this.logger.log('Indexer started');

    this.pollTimer = setInterval(async () => {
      try {
        await this.pollLedgers();
      } catch (error) {
        this.logger.error(`Poll error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }, this.pollIntervalMs);
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.logger.log('Indexer stopped');
  }

  private async pollLedgers(): Promise<void> {
    const transactions = await this.horizonClient.getTransactions(undefined, {
      limit: 50,
      order: 'asc',
      cursor: this.currentCursor ?? undefined,
    });

    for (const tx of transactions.records) {
      try {
        await this.processTransaction(tx);
        this.currentCursor = tx.paging_token;
      } catch (error) {
        this.logger.error(`Failed to process tx ${tx.hash}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (transactions.records.length > 0) {
      await this.saveLastProcessedLedger(this.currentCursor!);
    }
  }

  private async processTransaction(tx: { hash: string; paging_token: string; created_at: string; successful: boolean }): Promise<void> {
    if (!tx.successful) return;

    const events: IndexerEvent[] = [];  // Placeholder for actual event extraction

    for (const event of events) {
      try {
        switch (event.type) {
          case 'ProductRegistered':
          case 'ProductTransferred':
          case 'ProductRecalled':
            await this.productProcessor.process(event as ProductEvent);
            break;
          case 'LifecycleEventRecorded':
            await this.lifecycleProcessor.process(event as LifecycleEvent);
            break;
          case 'AttestationRequested':
          case 'AttestationApproved':
          case 'AttestationRejected':
          case 'AttestationEscalated':
            await this.attestationProcessor.process(event as AttestationEvent);
            break;
          case 'GreenTagIssued':
          case 'GreenTagRevoked':
            await this.certificateProcessor.process(event as CertificateEvent);
            break;
          case 'VerifierRegistered':
          case 'VerifierSlashed':
            await this.verifierProcessor.process(event as VerifierEvent);
            break;
        }
      } catch (error) {
        this.logger.error(`Event processor error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  async processLedger(seq: number): Promise<void> {
    this.logger.log(`Processing ledger ${seq}`);
    try {
      const ledger = await this.horizonClient.getLedger(seq);
      const transactions = await this.horizonClient.getTransactions(undefined, {
        limit: 200,
        order: 'asc',
        cursor: (ledger as any).paging_token,
      });

      for (const tx of transactions.records) {
        await this.processTransaction(tx);
      }
    } catch (error) {
      this.logger.error(`Failed to process ledger ${seq}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async handleReorg(fromLedger: number, toLedger: number): Promise<void> {
    this.logger.warn(`Handling reorg: rolling back ledgers ${fromLedger} to ${toLedger}`);

    const records = await this.prisma.lifecycleEvent.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 3600000),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    for (const record of records) {
      if (record.txHash) {
        try {
          await this.prisma.lifecycleEvent.delete({ where: { id: record.id } });
        } catch {
          // Continue if delete fails
        }
      }
    }

    this.currentCursor = null;
    this.logger.log('Reorg handled, indexer will resync from last valid state');
  }

  private async loadLastProcessedLedger(): Promise<string | null> {
    try {
      const lastEvent = await this.prisma.lifecycleEvent.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { txHash: true },
      });
      return lastEvent?.txHash ?? null;
    } catch {
      return null;
    }
  }

  private async saveLastProcessedLedger(cursor: string): Promise<void> {
    this.currentCursor = cursor;
  }
}
