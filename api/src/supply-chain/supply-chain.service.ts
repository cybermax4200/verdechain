import { Injectable, NotFoundException, Optional, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { LifecycleStage } from '@prisma/client';
import { StellarService } from '../stellar/stellar.service';
import { WebhookService } from '../webhooks/webhook.service';

@Injectable()
export class SupplyChainService {
  private readonly logger = new Logger(SupplyChainService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly stellarService?: StellarService,
    @Optional() private readonly webhookService?: WebhookService,
  ) {}

  async recordEvent(dto: CreateEventDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { manufacturer: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let txHash: string | null = null;
    if (this.stellarService?.isConfigured('lifecycleTracker')) {
      try {
        const callerScVal = this.stellarService.toAddressScVal(product.manufacturer?.publicKey);
        const productIdScVal = this.stellarService.toU64ScVal(product.productId);
        const stageScVal = this.stellarService.toSymbolScVal(dto.stage);
        const descScVal = this.stellarService.toStringScVal(dto.description ?? '');
        txHash = await this.stellarService.callContract('lifecycleTracker', 'record_event', [
          callerScVal,
          productIdScVal,
          stageScVal,
          descScVal,
        ]);
      } catch (err) {
        this.logger.warn(
          `On-chain lifecycle event recording skipped: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    const event = await this.prisma.lifecycleEvent.create({
      data: {
        productId: dto.productId,
        stage: dto.stage as LifecycleStage,
        description: dto.description,
        location: dto.location,
        timestamp: new Date(dto.timestamp),
        energyKwh: dto.energyKwh,
        fuelUsed: dto.fuelUsed,
        fuelType: dto.fuelType,
        wasteKg: dto.wasteKg,
        metadata: { ...((dto.metadata ?? {}) as object), ...(txHash ? { txHash } : {}) } as any,
        txHash,
      },
    });

    if (this.webhookService) {
      this.webhookService
        .dispatch('supply_chain.event_recorded', { event })
        .catch((err) => this.logger.warn(`Webhook dispatch error: ${err}`));
    }

    return event;
  }

  async batchRecord(eventsDto: CreateEventDto[]) {
    const results = [];
    for (const dto of eventsDto) {
      const event = await this.recordEvent(dto);
      results.push(event);
    }
    return results;
  }

  async getTimeline(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const events = await this.prisma.lifecycleEvent.findMany({
      where: { productId },
      orderBy: { timestamp: 'asc' },
    });

    const emissionsByStage: Record<string, number> = {};
    for (const event of events) {
      const stageEmissions = this.estimateEmissions(event);
      const stageKey = event.stage.toLowerCase();
      emissionsByStage[stageKey] = (emissionsByStage[stageKey] || 0) + stageEmissions;
    }

    return {
      productId,
      events,
      emissionsByStage,
    };
  }

  async getParticipants(productId: string): Promise<string[]> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        manufacturer: true,
        lifecycleEvents: true,
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const participants = new Set<string>();
    participants.add(product.manufacturer.publicKey);

    for (const event of product.lifecycleEvents) {
      if (event.location) {
        participants.add(event.location);
      }
    }

    return Array.from(participants);
  }

  private estimateEmissions(event: {
    energyKwh?: number | null;
    fuelUsed?: number | null;
    fuelType?: string | null;
    wasteKg?: number | null;
  }): number {
    let total = 0;

    if (event.energyKwh) {
      total += event.energyKwh * 0.5;
    }

    if (event.fuelUsed && event.fuelType) {
      const factors: Record<string, number> = {
        diesel: 2.68,
        gasoline: 2.31,
        natural_gas: 1.93,
        coal: 3.21,
        biomass: 1.0,
      };
      total += event.fuelUsed * (factors[event.fuelType.toLowerCase()] || 2.5);
    }

    if (event.wasteKg) {
      total += event.wasteKg * 0.6;
    }

    return total;
  }
}
