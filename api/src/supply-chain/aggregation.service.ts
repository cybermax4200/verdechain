import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ProvenanceNode {
  id: string;
  type: string;
  label: string;
  metadata?: Record<string, unknown>;
}

export interface ProvenanceEdge {
  source: string;
  target: string;
  type: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ProvenanceGraph {
  nodes: ProvenanceNode[];
  edges: ProvenanceEdge[];
}

@Injectable()
export class AggregationService {
  constructor(private readonly prisma: PrismaService) {}

  async buildProvenanceGraph(productId: string): Promise<ProvenanceGraph> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        manufacturer: true,
        lifecycleEvents: { orderBy: { timestamp: 'asc' } },
        materialInputs: true,
        certificates: true,
      },
    });
    if (!product) {
      return { nodes: [], edges: [] };
    }

    const nodes: ProvenanceNode[] = [];
    const edges: ProvenanceEdge[] = [];
    const addedIds = new Set<string>();

    const addNode = (node: ProvenanceNode) => {
      if (!addedIds.has(node.id)) {
        addedIds.add(node.id);
        nodes.push(node);
      }
    };

    addNode({
      id: product.manufacturer.id,
      type: 'manufacturer',
      label: product.manufacturer.name,
      metadata: { country: product.manufacturer.country },
    });

    addNode({
      id: product.id,
      type: 'product',
      label: product.name,
      metadata: {
        sku: product.sku,
        batch: product.batchNumber,
        type: product.productType,
      },
    });

    edges.push({
      source: product.manufacturer.id,
      target: product.id,
      type: 'manufactures',
      timestamp: product.createdAt,
    });

    for (const event of product.lifecycleEvents) {
      const eventId = `event:${event.id}`;
      addNode({
        id: eventId,
        type: 'lifecycle_event',
        label: event.stage.toLowerCase().replace(/_/g, ' '),
        metadata: {
          stage: event.stage,
          location: event.location,
          energyKwh: event.energyKwh,
          fuelUsed: event.fuelUsed,
          wasteKg: event.wasteKg,
        },
      });

      edges.push({
        source: product.id,
        target: eventId,
        type: event.stage.toLowerCase(),
        timestamp: event.timestamp,
        metadata: { location: event.location },
      });
    }

    for (const material of product.materialInputs) {
      const materialId = `material:${material.id}`;
      addNode({
        id: materialId,
        type: 'material',
        label: material.name,
        metadata: {
          quantity: material.quantity,
          unit: material.unit,
          source: material.source,
          originCountry: material.originCountry,
        },
      });

      edges.push({
        source: materialId,
        target: product.id,
        type: 'inputs',
        timestamp: product.createdAt,
        metadata: { quantity: material.quantity, unit: material.unit },
      });
    }

    for (const cert of product.certificates) {
      const certId = `certificate:${cert.id}`;
      addNode({
        id: certId,
        type: 'certificate',
        label: cert.title,
        metadata: {
          certType: cert.certType,
          status: cert.status,
          issuerId: cert.issuerId,
        },
      });

      edges.push({
        source: certId,
        target: product.id,
        type: 'certifies',
        timestamp: cert.issuedAt,
      });
    }

    return { nodes, edges };
  }
}
