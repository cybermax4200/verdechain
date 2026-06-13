import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface CertificateFilters {
  type?: string;
  status?: string;
  productId?: string;
  issuerId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class CertificatesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CertificateCreateInput) {
    return this.prisma.certificate.create({ data });
  }

  async findById(id: string) {
    return this.prisma.certificate.findUnique({
      where: { id },
      include: { product: { include: { manufacturer: true } } },
    });
  }

  async findByProduct(productId: string) {
    return this.prisma.certificate.findMany({
      where: { productId },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async findAll(filters: CertificateFilters) {
    const where: Prisma.CertificateWhereInput = {};
    const conditions: Prisma.CertificateWhereInput[] = [];

    if (filters.type) {
      conditions.push({ certType: filters.type as Prisma.EnumCertTypeFilter['equals'] });
    }
    if (filters.status) {
      conditions.push({ status: filters.status });
    }
    if (filters.productId) {
      conditions.push({ productId: filters.productId });
    }
    if (filters.issuerId) {
      conditions.push({ issuerId: filters.issuerId });
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.certificate.findMany({
        where,
        include: { product: true },
        skip,
        take: limit,
        orderBy: { issuedAt: 'desc' },
      }),
      this.prisma.certificate.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, data: Prisma.CertificateUpdateInput) {
    return this.prisma.certificate.update({ where: { id }, data });
  }
}
