import { VerdeChainClient } from './client';
import type { CertificateRecord, CertificateFilters, PaginatedResponse, CertType } from './types';

export interface IssueCertificateData {
  productId: string;
  title: string;
  certType: CertType;
  description?: string;
  expiresAt?: string;
  issuerPublicKey: string;
}

export class CertificatesAPI {
  constructor(private client: VerdeChainClient) {}

  async getCertificates(filters: CertificateFilters = {}): Promise<PaginatedResponse<CertificateRecord>> {
    const params: Record<string, string> = {};
    if (filters.type) params.type = filters.type;
    if (filters.status) params.status = filters.status;
    if (filters.productId) params.productId = filters.productId;
    if (filters.page) params.page = String(filters.page);
    if (filters.limit) params.limit = String(filters.limit);

    return this.client.request<PaginatedResponse<CertificateRecord>>({
      method: 'GET',
      url: '/certificates',
      params,
    });
  }

  async getCertificate(id: string): Promise<CertificateRecord> {
    return this.client.request<CertificateRecord>({
      method: 'GET',
      url: `/certificates/${id}`,
    });
  }

  async getCertificatePdf(id: string): Promise<ArrayBuffer> {
    const response = await this.client.request<ArrayBuffer>({
      method: 'GET',
      url: `/certificates/${id}/pdf`,
      responseType: 'arraybuffer',
    });
    return response;
  }

  async issueCertificate(data: IssueCertificateData): Promise<CertificateRecord> {
    return this.client.request<CertificateRecord>({
      method: 'POST',
      url: '/certificates',
      data,
    });
  }

  async revokeCertificate(id: string, reason: string): Promise<CertificateRecord> {
    return this.client.request<CertificateRecord>({
      method: 'POST',
      url: `/certificates/${id}/revoke`,
      data: { reason },
    });
  }

  async verifyCertificate(id: string): Promise<{ valid: boolean; details?: string }> {
    return this.client.request<{ valid: boolean; details?: string }>({
      method: 'POST',
      url: '/certificates/verify',
      data: { id },
    });
  }
}
