import {
  JsonLdGeneratorService,
  ProvenanceData,
} from '../../../src/certificates/generators/jsonld-generator';

describe('JsonLdGeneratorService', () => {
  let service: JsonLdGeneratorService;

  beforeEach(() => {
    service = new JsonLdGeneratorService();
  });

  describe('generateProvenanceDocument', () => {
    it('should generate valid JSON-LD schema document for product provenance', () => {
      const data: ProvenanceData = {
        productId: 'prod-42',
        productName: 'Organic Cotton Blanket',
        sku: 'BLK-001',
        batchNumber: 'BATCH-2024-X',
        manufacturer: {
          name: 'GreenTextiles Ltd',
          publicKey: 'GABC123',
          country: 'PT',
        },
        events: [
          {
            stage: 'RAW_MATERIAL_EXTRACTION',
            timestamp: new Date('2024-01-01T00:00:00Z'),
            location: 'India',
            description: 'Harvesting raw organic cotton',
          },
        ],
        certificates: [
          {
            id: 'cert-1',
            certType: 'ORGANIC',
            title: 'GOTS Organic Certified',
            issuedAt: new Date('2024-01-05T00:00:00Z'),
            status: 'ACTIVE',
          },
        ],
      };

      const doc = service.generateProvenanceDocument(data);

      expect(doc['@context']).toBeDefined();
      expect(doc['@id']).toBe('urn:product:prod-42');
      expect(doc['@type']).toBe('product:Product');
      expect(doc.name).toBe('Organic Cotton Blanket');
      expect(doc.sku).toBe('BLK-001');

      const mfr = doc.manufacturer as Record<string, unknown>;
      expect(mfr['@type']).toBe('schema:Organization');
      expect(mfr.name).toBe('GreenTextiles Ltd');
      expect(mfr.identifier).toBe('GABC123');

      const events = doc.lifecycleEvents as Array<Record<string, unknown>>;
      expect(events).toHaveLength(1);
      expect(events[0]?.stage).toBe('RAW_MATERIAL_EXTRACTION');
      expect(events[0]?.location).toBe('India');

      const certs = doc.certificates as Array<Record<string, unknown>>;
      expect(certs).toHaveLength(1);
      expect(certs[0]?.identifier).toBe('cert-1');
    });

    it('should generate minimal document when events and certificates are omitted', () => {
      const data: ProvenanceData = {
        productId: 'prod-min',
        productName: 'Basic Item',
        manufacturer: {
          name: 'Maker',
          publicKey: 'GXYZ',
        },
      };

      const doc = service.generateProvenanceDocument(data);
      expect(doc['@id']).toBe('urn:product:prod-min');
      expect(doc.lifecycleEvents).toBeUndefined();
      expect(doc.certificates).toBeUndefined();
    });
  });

  describe('generateVerificationReport', () => {
    it('should generate verification report document', () => {
      const report = service.generateVerificationReport('cert-999', true, {
        issuerSignatureValid: true,
        ledgerBlock: 12345,
      });

      expect(report['@id']).toBe('urn:verification:cert-999');
      expect(report['@type']).toBe('verdechain:VerificationReport');
      expect(report.certificateId).toBe('cert-999');
      expect(report.verified).toBe(true);
      expect(report.details).toEqual({
        issuerSignatureValid: true,
        ledgerBlock: 12345,
      });
      expect(report.verifiedAt).toBeDefined();
    });
  });
});
