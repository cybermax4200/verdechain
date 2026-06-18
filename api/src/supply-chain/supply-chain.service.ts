import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { LifecycleStage } from '@prisma/client';

@Injectable()
export class SupplyChainService {
  constructor(private readonly prisma: PrismaService) {}

  async recordEvent(dto: CreateEventDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
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
        metadata: dto.metadata as any,
      },
    });

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
