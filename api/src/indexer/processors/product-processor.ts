import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ProductEvent {
  type: 'ProductRegistered' | 'ProductTransferred' | 'ProductRecalled';
  productId: string;
  data: Record<string, unknown>;
  txHash: string;
  ledger: number;
  timestamp: Date;
}

@Injectable()
export class ProductProcessor {
  private readonly logger = new Logger(ProductProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  async process(event: ProductEvent): Promise<void> {
    this.logger.log(`Processing ${event.type} for product ${event.productId}`);

    switch (event.type) {
      case 'ProductRegistered':
        await this.handleRegistered(event);
        break;
      case 'ProductTransferred':
        await this.handleTransferred(event);
        break;
      case 'ProductRecalled':
        await this.handleRecalled(event);
        break;
    }
  }

  private async handleRegistered(event: ProductEvent): Promise<void> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { productId: parseInt(event.productId, 10) },
    });

    if (existingProduct) {
      await this.prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          status: 'ACTIVE',
          metadata: { ...(existingProduct.metadata as Record<string, unknown>), ...event.data },
        },
      });
      this.logger.log(`Updated existing product ${event.productId} from on-chain event`);
    }
  }

  private async handleTransferred(event: ProductEvent): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { productId: parseInt(event.productId, 10) },
    });

    if (product) {
      const newOwner = event.data['to'] as string;
      this.logger.log(`Product ${event.productId} transferred to ${newOwner}`);
    }
  }

  private async handleRecalled(event: ProductEvent): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { productId: parseInt(event.productId, 10) },
    });

    if (product) {
      await this.prisma.product.update({
        where: { id: product.id },
        data: {
          status: 'RECALLED',
          metadata: {
            ...(product.metadata as Record<string, unknown>),
            recallReason: event.data['reason'] as string,
            recalledAt: event.timestamp,
          },
        },
      });
      this.logger.warn(`Product ${event.productId} recalled: ${event.data['reason'] as string}`);
    }
  }
}
