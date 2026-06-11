import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface ProductFilters {
  type?: string;
  origin?: string;
  manufacturer?: string;
  q?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ProductCreateInput) {
    return this.prisma.product.create({ data });
  }

  async findById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: { manufacturer: true },
    });
  }

  async findByProductId(productId: number) {
    return this.prisma.product.findUnique({
      where: { productId },
      include: { manufacturer: true },
    });
  }

  async findByBatch(batch: string) {
    return this.prisma.product.findMany({
      where: { batchNumber: batch },
      include: { manufacturer: true },
    });
  }

  async findByOwner(publicKey: string) {
    return this.prisma.product.findMany({
      where: { manufacturer: { publicKey } },
      include: { manufacturer: true },
    });
  }

  async findAll(filters: ProductFilters) {
    const where: Prisma.ProductWhereInput = {};
    const conditions: Prisma.ProductWhereInput[] = [];

    if (filters.type) {
      conditions.push({ productType: filters.type });
    }
    if (filters.origin) {
      conditions.push({ originCountry: filters.origin });
    }
    if (filters.manufacturer) {
      conditions.push({ manufacturerId: filters.manufacturer });
    }
    if (filters.q) {
      conditions.push({
        OR: [
          { name: { contains: filters.q, mode: 'insensitive' } },
          { sku: { contains: filters.q, mode: 'insensitive' } },
          { batchNumber: { contains: filters.q, mode: 'insensitive' } },
          { description: { contains: filters.q, mode: 'insensitive' } },
        ],
      });
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (filters.sort) {
      const [field, dir] = filters.sort.split(':');
      if (field && dir) {
        orderBy = { [field]: dir as 'asc' | 'desc' };
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { manufacturer: true },
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({ where: { id }, data });
  }

  async getNextProductId(): Promise<number> {
    const last = await this.prisma.product.findFirst({
      orderBy: { productId: 'desc' },
      select: { productId: true },
    });
    return (last?.productId ?? 0) + 1;
  }
}
