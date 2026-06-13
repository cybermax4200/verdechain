import { Injectable } from '@nestjs/common';

export interface JsonLdDocument {
  '@context': Record<string, unknown>;
  '@id': string;
  '@type': string;
  [key: string]: unknown;
}

export interface ProvenanceData {
  productId: string;
  productName: string;
  sku?: string;
  batchNumber?: string;
  manufacturer: {
    name: string;
    publicKey: string;
    country?: string;
  };
  events?: Array<{
    stage: string;
    timestamp: Date;
    location?: string;
    description?: string;
  }>;
  certificates?: Array<{
    id: string;
    certType: string;
    title: string;
    issuedAt: Date;
    status: string;
  }>;
}

@Injectable()
export class JsonLdGeneratorService {
  generateProvenanceDocument(data: ProvenanceData): JsonLdDocument {
    const doc: JsonLdDocument = {
      '@context': {
        schema: 'https://schema.org/',
        verdechain: 'https://verdechain.io/ontology/',
        product: 'schema:Product',
        manufacturer: 'schema:manufacturer',
        lifecycleEvent: 'verdechain:LifecycleEvent',
        certificate: 'verdechain:Certificate',
        sku: 'schema:sku',
        batchNumber: 'schema:batchNumber',
        name: 'schema:name',
        description: 'schema:description',
        location: 'schema:location',
        timestamp: 'schema:timestamp',
        stage: 'verdechain:lifecycleStage',
        issuedAt: 'verdechain:issuedAt',
        certType: 'verdechain:certificateType',
        status: 'verdechain:status',
      },
      '@id': `urn:product:${data.productId}`,
      '@type': 'product:Product',
      name: data.productName,
      sku: data.sku,
      batchNumber: data.batchNumber,
      manufacturer: {
        '@type': 'schema:Organization',
        name: data.manufacturer.name,
        identifier: data.manufacturer.publicKey,
        location: data.manufacturer.country,
      },
    };

    if (data.events && data.events.length > 0) {
      doc.lifecycleEvents = data.events.map((event) => ({
        '@type': 'lifecycleEvent:LifecycleEvent',
        stage: event.stage,
        timestamp: event.timestamp.toISOString(),
        location: event.location,
        description: event.description,
      }));
    }

    if (data.certificates && data.certificates.length > 0) {
      doc.certificates = data.certificates.map((cert) => ({
        '@type': 'certificate:Certificate',
        identifier: cert.id,
        certType: cert.certType,
        name: cert.title,
        issuedAt: cert.issuedAt.toISOString(),
        status: cert.status,
      }));
    }

    return doc;
  }

  generateVerificationReport(
    certificateId: string,
    verified: boolean,
    details: Record<string, unknown>,
  ): JsonLdDocument {
    return {
      '@context': {
        schema: 'https://schema.org/',
        verdechain: 'https://verdechain.io/ontology/',
      },
      '@id': `urn:verification:${certificateId}`,
      '@type': 'verdechain:VerificationReport',
      certificateId,
      verified,
      details,
      verifiedAt: new Date().toISOString(),
    };
  }
}
