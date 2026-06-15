import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface LifecycleEvent {
  type: 'LifecycleEventRecorded';
  productId: string;
  data: Record<string, unknown>;
  txHash: string;
  ledger: number;
  timestamp: Date;
}

@Injectable()
export class LifecycleProcessor {
  private readonly logger = new Logger(LifecycleProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  async process(event: LifecycleEvent): Promise<void> {
    this.logger.log(`Processing LifecycleEventRecorded for product ${event.productId}`);

    const product = await this.prisma.product.findUnique({
      where: { productId: parseInt(event.productId, 10) },
    });

    if (!product) {
      this.logger.warn(`Product ${event.productId} not found for lifecycle event`);
      return;
    }

    const stage = (event.data['stage'] as string) ?? 'MANUFACTURING';
    await this.prisma.lifecycleEvent.create({
      data: {
        productId: product.id,
        stage: stage as any,
        description: (event.data['description'] as string) ?? null,
        location: (event.data['location'] as string) ?? null,
        timestamp: event.timestamp,
        energyKwh: (event.data['energyKwh'] as number) ?? null,
        fuelUsed: (event.data['fuelUsed'] as number) ?? null,
        fuelType: (event.data['fuelType'] as string) ?? null,
        wasteKg: (event.data['wasteKg'] as number) ?? null,
        metadata: event.data as any,
        txHash: event.txHash,
      },
    });

    this.logger.log(`Lifecycle event recorded for product ${event.productId}`);
  }
}
