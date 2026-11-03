import { Injectable, NotFoundException, Optional, Logger } from '@nestjs/common';
import { ProductsRepository, ProductFilters } from './products.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { PrismaService } from '../prisma/prisma.service';
import { StellarService } from '../stellar/stellar.service';
import { WebhookService } from '../webhooks/webhook.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly repository: ProductsRepository,
    private readonly prisma: PrismaService,
    @Optional() private readonly stellarService?: StellarService,
    @Optional() private readonly webhookService?: WebhookService,
  ) {}

  async create(dto: CreateProductDto) {
    const productId = await this.repository.getNextProductId();

    let manufacturer = null;
    if (dto.manufacturerId) {
      manufacturer = await this.prisma.manufacturer.findUnique({
        where: { id: dto.manufacturerId },
      });
    }
    if (!manufacturer && (dto.manufacturerPublicKey || dto.manufacturerId)) {
      const key = dto.manufacturerPublicKey ?? dto.manufacturerId;
      manufacturer = await this.prisma.manufacturer.findUnique({
        where: { publicKey: key },
      });
    }
    if (!manufacturer) {
      throw new NotFoundException('Manufacturer not found');
    }

    let txHash: string | null = null;
    if (this.stellarService && this.stellarService.isConfigured('productRegistry')) {
      try {
        const manufacturerScVal = this.stellarService.toAddressScVal(manufacturer.publicKey);
        const metadataScVal = this.stellarService.toStringScVal(dto.sku ?? dto.name);
        txHash = await this.stellarService.callContract('productRegistry', 'register_product', [
          manufacturerScVal,
          metadataScVal,
        ]);
      } catch (err) {
        this.logger.warn(
          `On-chain product registration skipped: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    const product = await this.repository.create({
      productId,
      name: dto.name,
      description: dto.description,
      sku: dto.sku,
      batchNumber: dto.batchNumber,
      productType: dto.productType,
      originCountry: dto.originCountry,
      metadata: { ...((dto.metadata ?? {}) as object), ...(txHash ? { txHash } : {}) } as any,
      manufacturer: { connect: { id: manufacturer.id } },
    });

    if (this.webhookService) {
      this.webhookService
        .dispatch('product.created', { product })
        .catch((err) => this.logger.warn(`Webhook dispatch error: ${err}`));
    }

    return product;
  }

  async findAll(filters: ProductFilters) {
    return this.repository.findAll(filters);
  }

  async findOne(id: string) {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async getProvenance(id: string) {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const events = await this.prisma.lifecycleEvent.findMany({
      where: { productId: product.id },
      orderBy: { timestamp: 'asc' },
    });

    const nodes = [
      {
        id: product.manufacturer.id,
        type: 'manufacturer',
        label: product.manufacturer.name,
        metadata: { country: product.manufacturer.country },
      },
      {
        id: product.id,
        type: 'product',
        label: product.name,
        metadata: { sku: product.sku, batch: product.batchNumber },
      },
      ...events
        .filter((e) => e.location)
        .map((e) => ({
          id: `${e.id}-location`,
          type: 'location',
          label: e.location || '',
          metadata: { stage: e.stage },
        })),
    ];

    const edges = events.map((e) => ({
      source: product.id,
      target: `${e.id}-location`,
      type: e.stage.toLowerCase(),
      timestamp: e.timestamp,
      metadata: {
        energyKwh: e.energyKwh,
        fuelUsed: e.fuelUsed,
        wasteKg: e.wasteKg,
      },
    }));

    return { nodes, edges };
  }

  async getLifecycle(id: string) {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.lifecycleEvent.findMany({
      where: { productId: product.id },
      orderBy: { timestamp: 'asc' },
    });
  }

  async getCarbon(id: string) {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.carbonFootprint.findMany({
      where: { productId: product.id },
      orderBy: { calculatedAt: 'desc' },
    });
  }

  async getCertificates(id: string) {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.certificate.findMany({
      where: { productId: product.id },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async getProductsByOwner(publicKey: string) {
    return this.repository.findByOwner(publicKey);
  }

  async getProductsByBatch(batch: string) {
    return this.repository.findByBatch(batch);
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
}
