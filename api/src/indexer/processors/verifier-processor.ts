import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface VerifierEvent {
  type: 'VerifierRegistered' | 'VerifierSlashed';
  verifierId: string;
  data: Record<string, unknown>;
  txHash: string;
  ledger: number;
  timestamp: Date;
}

@Injectable()
export class VerifierProcessor {
  private readonly logger = new Logger(VerifierProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  async process(event: VerifierEvent): Promise<void> {
    this.logger.log(`Processing ${event.type} for verifier ${event.verifierId}`);

    switch (event.type) {
      case 'VerifierRegistered':
        await this.handleRegistered(event);
        break;
      case 'VerifierSlashed':
        await this.handleSlashed(event);
        break;
    }
  }

  private async handleRegistered(event: VerifierEvent): Promise<void> {
    const existing = await this.prisma.verifier.findUnique({
      where: { publicKey: event.verifierId },
    });

    if (!existing) {
      await this.prisma.verifier.create({
        data: {
          publicKey: event.verifierId,
          name: (event.data['name'] as string) ?? `Verifier ${event.verifierId.slice(0, 8)}`,
          email: (event.data['email'] as string) ?? null,
          description: (event.data['description'] as string) ?? null,
          stakeXlm: (event.data['stakeXlm'] as number) ?? 1000,
          reputationScore: 0,
          status: 'ACTIVE',
          metadata: event.data as any,
        },
      });
      this.logger.log(`Verifier ${event.verifierId} registered from on-chain event`);
    }
  }

  private async handleSlashed(event: VerifierEvent): Promise<void> {
    const verifier = await this.prisma.verifier.findUnique({
      where: { publicKey: event.verifierId },
    });

    if (verifier) {
      const slashAmount = (event.data['amount'] as number) ?? 0;
      await this.prisma.verifier.update({
        where: { id: verifier.id },
        data: {
          stakeXlm: Math.max(0, verifier.stakeXlm - slashAmount),
          status: verifier.stakeXlm - slashAmount <= 0 ? 'SLASHED' : verifier.status,
        },
      });
      this.logger.warn(`Verifier ${event.verifierId} slashed by ${slashAmount} XLM`);
    }
  }
}
