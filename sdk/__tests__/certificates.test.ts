import { VerdeChainClient } from '../src/client';
import { CertificatesAPI } from '../src/certificates';
import type { CertType } from '../src/types';

describe('CertificatesAPI', () => {
  const client = new VerdeChainClient({ apiUrl: 'http://test.api' });
  const certificates = new CertificatesAPI(client);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getCertificates', () => {
    it('should query certificates with all filter parameters', async () => {
      const requestSpy = jest.spyOn(client, 'request').mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      await certificates.getCertificates({
        type: 'green_tag',
        status: 'ACTIVE',
        productId: 'prod-123',
        page: 2,
        limit: 25,
      });

      expect(requestSpy).toHaveBeenCalledWith({
        method: 'GET',
        url: '/certificates',
        params: {
          type: 'green_tag',
          status: 'ACTIVE',
          productId: 'prod-123',
          page: '2',
          limit: '25',
        },
      });
    });

    it('should query certificates with empty filters', async () => {
      const requestSpy = jest.spyOn(client, 'request').mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      await certificates.getCertificates();

      expect(requestSpy).toHaveBeenCalledWith({
        method: 'GET',
        url: '/certificates',
        params: {},
      });
    });
  });

  describe('getCertificate', () => {
    it('should fetch certificate details by id', async () => {
      const mockCert = {
        id: 'cert-1',
        productId: 'prod-1',
        certType: 'carbon_neutral' as CertType,
        title: 'Carbon Neutral Certificate',
        status: 'ACTIVE' as const,
        issuedAt: '2024-01-01T00:00:00.000Z',
        issuerPublicKey: 'G123',
      };

      const requestSpy = jest.spyOn(client, 'request').mockResolvedValue(mockCert);

      const result = await certificates.getCertificate('cert-1');
      expect(requestSpy).toHaveBeenCalledWith({
        method: 'GET',
        url: '/certificates/cert-1',
      });
      expect(result).toEqual(mockCert);
    });
  });

  describe('getCertificatePdf', () => {
    it('should fetch certificate pdf array buffer', async () => {
      const mockBuffer = new ArrayBuffer(8);
      const requestSpy = jest.spyOn(client, 'request').mockResolvedValue(mockBuffer);

      const result = await certificates.getCertificatePdf('cert-1');
      expect(requestSpy).toHaveBeenCalledWith({
        method: 'GET',
        url: '/certificates/cert-1/pdf',
        responseType: 'arraybuffer',
      });
      expect(result).toBe(mockBuffer);
    });
  });

  describe('issueCertificate', () => {
    it('should post issuance payload', async () => {
      const issueData = {
        productId: 'prod-1',
        title: 'Organic Certified',
        certType: 'organic' as CertType,
        issuerPublicKey: 'GABC',
        description: 'Certified organic process',
      };

      const mockResponse = {
        id: 'cert-2',
        ...issueData,
        status: 'ACTIVE' as const,
        issuedAt: '2024-01-01',
      };
      const requestSpy = jest.spyOn(client, 'request').mockResolvedValue(mockResponse);

      const result = await certificates.issueCertificate(issueData);
      expect(requestSpy).toHaveBeenCalledWith({
        method: 'POST',
        url: '/certificates',
        data: issueData,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('revokeCertificate', () => {
    it('should revoke certificate with given reason', async () => {
      const requestSpy = jest.spyOn(client, 'request').mockResolvedValue({
        id: 'cert-1',
        status: 'REVOKED',
      });

      const result = await certificates.revokeCertificate('cert-1', 'Failed recertification audit');
      expect(requestSpy).toHaveBeenCalledWith({
        method: 'POST',
        url: '/certificates/cert-1/revoke',
        data: { reason: 'Failed recertification audit' },
      });
      expect(result.id).toBe('cert-1');
    });
  });

  describe('verifyCertificate', () => {
    it('should verify certificate validity', async () => {
      const requestSpy = jest.spyOn(client, 'request').mockResolvedValue({
        valid: true,
        details: 'Valid on ledger',
      });

      const result = await certificates.verifyCertificate('cert-1');
      expect(requestSpy).toHaveBeenCalledWith({
        method: 'POST',
        url: '/certificates/verify',
        data: { certificateId: 'cert-1', id: 'cert-1' },
      });
      expect(result.valid).toBe(true);
    });
  });
});
