import { Injectable } from '@nestjs/common';
import { Keypair, xdr } from '@stellar/stellar-sdk';
import { SorobanClientService } from './soroban-client';

export interface ContractAddresses {
  productRegistry: string;
  lifecycleTracker: string;
  attestation: string;
  greenTagCert: string;
  verifierRegistry: string;
  carbonOracle: string;
}

@Injectable()
export class StellarService {
  constructor(
    private readonly sorobanClient: SorobanClientService,
    public readonly contractAddresses: ContractAddresses,
  ) {}

  async callContract(
    contractName: keyof ContractAddresses,
    method: string,
    args: xdr.ScVal[] = [],
    sourceKeypair?: Keypair,
  ): Promise<string> {
    const contractId = this.contractAddresses[contractName];
    if (!contractId) {
      throw new Error(`Contract address not configured: ${contractName}`);
    }
    return this.sorobanClient.callContract(contractId, method, args, sourceKeypair);
  }

  async simulateContract(
    contractName: keyof ContractAddresses,
    method: string,
    args: xdr.ScVal[] = [],
  ): Promise<xdr.ScVal> {
    const contractId = this.contractAddresses[contractName];
    if (!contractId) {
      throw new Error(`Contract address not configured: ${contractName}`);
    }
    return this.sorobanClient.simulateContract(contractId, method, args);
  }

  async getContractEvents(contractName: keyof ContractAddresses, startLedger?: number) {
    const contractId = this.contractAddresses[contractName];
    if (!contractId) {
      throw new Error(`Contract address not configured: ${contractName}`);
    }
    return this.sorobanClient.getContractEvents(contractId, startLedger);
  }

  async buildTransaction(
    contractName: keyof ContractAddresses,
    method: string,
    args: xdr.ScVal[],
    sourceKeypair: Keypair,
  ): Promise<string> {
    const contractId = this.contractAddresses[contractName];
    if (!contractId) {
      throw new Error(`Contract address not configured: ${contractName}`);
    }
    return this.sorobanClient.buildTransaction(contractId, method, args, sourceKeypair);
  }

  async signAndSend(xdr: string, keypair: Keypair): Promise<string> {
    return this.sorobanClient.signAndSend(xdr, keypair);
  }

  isConfigured(contractName: keyof ContractAddresses): boolean {
    const contractId = this.contractAddresses[contractName];
    return Boolean(contractId && contractId.length > 0 && !contractId.includes('REPLACE_ME'));
  }

  getContractId(contractName: keyof ContractAddresses): string {
    const contractId = this.contractAddresses[contractName];
    if (!contractId) {
      throw new Error(`Contract address not configured: ${contractName}`);
    }
    return contractId;
  }
}
