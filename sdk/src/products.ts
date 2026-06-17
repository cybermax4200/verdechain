import { VerdeChainClient } from './client';
import type { ProductMetadata, ProductFilters, PaginatedResponse } from './types';

export interface CreateProductData {
  name: string;
  description?: string;
  sku?: string;
  productType?: string;
  originCountry?: string;
  manufacturerPublicKey: string;
  ipfsHash?: string;
}

export class ProductsAPI {
  constructor(private client: VerdeChainClient) {}

  async getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<ProductMetadata>> {
    const params: Record<string, string> = {};
    if (filters.q) params.q = filters.q;
    if (filters.type) params.type = filters.type;
    if (filters.origin) params.origin = filters.origin;
    if (filters.sort) params.sort = filters.sort;
    if (filters.page) params.page = String(filters.page);
    if (filters.limit) params.limit = String(filters.limit);

    return this.client.request<PaginatedResponse<ProductMetadata>>({
      method: 'GET',
      url: '/products',
      params,
    });
  }

  async getProduct(id: string): Promise<ProductMetadata> {
    return this.client.request<ProductMetadata>({
      method: 'GET',
      url: `/products/${id}`,
    });
  }

  async registerProduct(data: CreateProductData): Promise<ProductMetadata> {
    return this.client.request<ProductMetadata>({
      method: 'POST',
      url: '/products',
      data,
    });
  }

  async getProvenance(id: string): Promise<{ nodes: any[]; edges: any[] }> {
    return this.client.request<{ nodes: any[]; edges: any[] }>({
      method: 'GET',
      url: `/products/${id}/provenance`,
    });
  }

  async getProductsByOwner(publicKey: string): Promise<ProductMetadata[]> {
    return this.client.request<ProductMetadata[]>({
      method: 'GET',
      url: '/products/owned',
      params: { publicKey },
    });
  }

  async getProductsByBatch(batch: string): Promise<ProductMetadata[]> {
    return this.client.request<ProductMetadata[]>({
      method: 'GET',
      url: `/products/batch/${batch}`,
    });
  }
}
