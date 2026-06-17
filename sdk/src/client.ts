import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { SDKConfig } from './types';

const DEFAULT_CONFIG: Partial<SDKConfig> = {
  apiUrl: 'http://localhost:3000',
  networkPassphrase: 'Test SDF Network ; September 2015',
};

export class VerdeChainClient {
  private client: AxiosInstance;
  private authToken: string | null = null;
  public readonly config: SDKConfig;

  constructor(config: Partial<SDKConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config } as SDKConfig;

    if (!this.config.apiUrl) {
      throw new Error('VerdeChainClient: apiUrl is required');
    }

    this.client = axios.create({
      baseURL: this.config.apiUrl,
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

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }
}
