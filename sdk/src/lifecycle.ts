import { VerdeChainClient } from './client';
import type { LifecycleEvent, LifecycleStage, MaterialInput } from './types';

export interface RecordEventData {
  productId: string;
  stage: LifecycleStage;
  description?: string;
  location?: string;
  timestamp?: string;
  energyKwh?: number;
  fuelUsed?: number;
  fuelType?: string;
  wasteKg?: number;
  materialInputs?: MaterialInput[];
}

export class LifecycleAPI {
  constructor(private client: VerdeChainClient) {}

  async getEvents(productId: string): Promise<LifecycleEvent[]> {
    return this.client.request<LifecycleEvent[]>({
      method: 'GET',
      url: `/products/${productId}/lifecycle`,
    });
  }

  async recordEvent(data: RecordEventData): Promise<LifecycleEvent> {
    return this.client.request<LifecycleEvent>({
      method: 'POST',
      url: '/supply-chain/events',
      data,
    });
  }

  async batchRecordEvents(events: RecordEventData[]): Promise<LifecycleEvent[]> {
    return this.client.request<LifecycleEvent[]>({
      method: 'POST',
      url: '/supply-chain/events/batch',
      data: { events },
    });
  }

  async getTimeline(productId: string): Promise<LifecycleEvent[]> {
    return this.client.request<LifecycleEvent[]>({
      method: 'GET',
      url: `/products/${productId}/lifecycle`,
    });
  }

  async getParticipants(productId: string): Promise<{ name: string; role: string }[]> {
    return this.client.request<{ name: string; role: string }[]>({
      method: 'GET',
      url: `/products/${productId}/participants`,
    });
  }
}
