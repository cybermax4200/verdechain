import { VerdeChainClient } from './client';
import type { VerifierRecord, AttestationRecord } from './types';

export interface RegisterVerifierData {
  name: string;
  publicKey: string;
  email?: string;
}

export class VerifiersAPI {
  constructor(private client: VerdeChainClient) {}

  async getVerifiers(): Promise<VerifierRecord[]> {
    return this.client.request<VerifierRecord[]>({
      method: 'GET',
      url: '/verifiers',
    });
  }

  async getVerifier(id: string): Promise<VerifierRecord> {
    return this.client.request<VerifierRecord>({
      method: 'GET',
      url: `/verifiers/${id}`,
    });
  }

  async registerVerifier(data: RegisterVerifierData): Promise<VerifierRecord> {
    return this.client.request<VerifierRecord>({
      method: 'POST',
      url: '/verifiers/register',
      data,
    });
  }

  async addStake(id: string, amount: string): Promise<{ stake: string }> {
    return this.client.request<{ stake: string }>({
      method: 'PUT',
      url: `/verifiers/${id}/stake`,
      data: { amount },
    });
  }

  async getPendingAttestations(): Promise<AttestationRecord[]> {
    return this.client.request<AttestationRecord[]>({
      method: 'GET',
      url: '/verifiers/pending',
    });
  }

  async heartbeat(id: string): Promise<{ status: string; timestamp: string }> {
    return this.client.request<{ status: string; timestamp: string }>({
      method: 'POST',
      url: `/verifiers/${id}/heartbeat`,
    });
  }
}
