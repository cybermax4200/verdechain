import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface ProductFilters {
  q?: string;
  type?: string;
  origin?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface CertificateFilters {
  type?: string;
  status?: string;
  productId?: string;
  page?: number;
  limit?: number;
}

export interface LifecycleEvent {
  id?: string;
  productId?: string;
  stage?: string;
  description?: string;
  location?: string;
  timestamp?: string;
  energyKwh?: number;
  fuelUsed?: number;
  fuelType?: string;
  wasteKg?: number;
}

export interface CarbonFootprint {
  id?: string;
  productId?: string;
  scope1: number;
  scope2: number;
  scope3: number;
  totalFootprint: number;
  confidenceScore?: number;
  methodology: string;
  breakdown?: Record<string, unknown>;
  calculatedAt?: string;
}

class ApiClient {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor(baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') {
    this.client = axios.create({
      baseURL,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config) => {
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.authToken = null;
        }
        return Promise.reject(error);
      },
    );
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }

  async getProducts(filters: ProductFilters = {}) {
    const params: Record<string, string> = {};
    if (filters.q) params.q = filters.q;
    if (filters.type) params.type = filters.type;
    if (filters.origin) params.origin = filters.origin;
    if (filters.sort) params.sort = filters.sort;
    if (filters.page) params.page = String(filters.page);
    if (filters.limit) params.limit = String(filters.limit);

    return this.request<{
      data: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>({
      method: 'GET',
      url: '/products',
      params,
    });
  }

  async getProduct(id: string) {
    return this.request<any>({ method: 'GET', url: `/products/${id}` });
  }

  async getProvenance(id: string) {
    return this.request<{ nodes: any[]; edges: any[] }>({
      method: 'GET',
      url: `/products/${id}/provenance`,
    });
  }

  async getLifecycle(id: string) {
    return this.request<LifecycleEvent[]>({
      method: 'GET',
      url: `/products/${id}/lifecycle`,
    });
  }

  async getCarbonFootprint(id: string) {
    return this.request<any[]>({
      method: 'GET',
      url: `/products/${id}/carbon`,
    });
  }

  async calculateFootprint(productId: string) {
    return this.request<CarbonFootprint>({
      method: 'GET',
      url: `/carbon/footprint/${productId}`,
    });
  }

  async getCertificates(filters: CertificateFilters = {}) {
    return this.request<{ data: any[]; total: number }>({
      method: 'GET',
      url: '/certificates',
      params: {
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status }),
        ...(filters.page && { page: String(filters.page) }),
        ...(filters.limit && { limit: String(filters.limit) }),
      },
    });
  }

  async getCertificate(id: string) {
    return this.request<any>({ method: 'GET', url: `/certificates/${id}` });
  }

  async getCertificatesByProduct(productId: string) {
    return this.request<any[]>({
      method: 'GET',
      url: `/certificates/product/${productId}`,
    });
  }

  async getVerifiers() {
    return this.request<any[]>({ method: 'GET', url: '/verifiers' });
  }

  async registerWebhook(url: string, events: string[], secret: string) {
    return this.request<any>({
      method: 'POST',
      url: '/webhooks',
      data: { url, events, secret },
    });
  }
}

export const api = new ApiClient();
