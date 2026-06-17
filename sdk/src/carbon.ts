import { VerdeChainClient } from './client';
import type { CarbonFootprint, EmissionsBreakdown } from './types';

export class CarbonAPI {
  constructor(private client: VerdeChainClient) {}

  async getFootprint(productId: string): Promise<CarbonFootprint> {
    return this.client.request<CarbonFootprint>({
      method: 'GET',
      url: `/carbon/footprint/${productId}`,
    });
  }

  async getBreakdown(productId: string): Promise<EmissionsBreakdown[]> {
    return this.client.request<EmissionsBreakdown[]>({
      method: 'GET',
      url: `/carbon/breakdown/${productId}`,
    });
  }

  async compare(productIds: string[]): Promise<CarbonFootprint[]> {
    return this.client.request<CarbonFootprint[]>({
      method: 'GET',
      url: '/carbon/compare',
      params: { ids: productIds.join(',') },
    });
  }

  async getFactors(): Promise<Record<string, number>> {
    return this.client.request<Record<string, number>>({
      method: 'GET',
      url: '/carbon/factors',
    });
  }

  async getGridIntensity(region: string): Promise<{ region: string; intensity: number }> {
    return this.client.request<{ region: string; intensity: number }>({
      method: 'GET',
      url: `/carbon/grid-intensity/${region}`,
    });
  }
}
