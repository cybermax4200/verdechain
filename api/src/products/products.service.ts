import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductsRepository, ProductFilters } from './products.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly repository: ProductsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateProductDto) {
    const productId = await this.repository.getNextProductId();

    const manufacturer = await this.prisma.manufacturer.findUnique({
      where: { id: dto.manufacturerId },
    });
    if (!manufacturer) {
      throw new NotFoundException('Manufacturer not found');
    }

    const product = await this.repository.create({
      productId,
      name: dto.name,
      description: dto.description,
      sku: dto.sku,
      batchNumber: dto.batchNumber,
      productType: dto.productType,
      originCountry: dto.originCountry,
      metadata: dto.metadata as any,
      manufacturer: { connect: { id: dto.manufacturerId } },
    });

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
}
