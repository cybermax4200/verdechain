import { Injectable, Logger } from '@nestjs/common';
import {
  rpc,
  TransactionBuilder,
  Operation,
  Keypair,
  xdr,
} from '@stellar/stellar-sdk';

export interface SorobanClientConfig {
  rpcUrl: string;
  networkPassphrase: string;
  adminSecretKey?: string;
}

@Injectable()
export class SorobanClientService {
  private readonly logger = new Logger(SorobanClientService.name);
  private readonly server: rpc.Server;
  private readonly networkPassphrase: string;
  private readonly adminKeypair?: Keypair;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  constructor(_config: SorobanClientConfig) {
    this.server = new rpc.Server(_config.rpcUrl);
    this.networkPassphrase = _config.networkPassphrase;
    if (_config.adminSecretKey) {
      this.adminKeypair = Keypair.fromSecret(_config.adminSecretKey);
    }
  }

  async callContract(
    contractId: string,
    method: string,
    args: xdr.ScVal[] = [],
    sourceKeypair?: Keypair,
  ): Promise<string> {
    const source = sourceKeypair ?? this.adminKeypair;
    if (!source) {
      throw new Error('No source keypair available for contract call');
    }

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const account = await this.server.getAccount(source.publicKey());

        const tx = new TransactionBuilder(account, {
          fee: '100000',
          networkPassphrase: this.networkPassphrase,
        })
          .addOperation(
            Operation.invokeContractFunction({
              contract: contractId,
              function: method,
              args,
            }),
          )
          .setTimeout(30)
          .build();

        const prepared = await this.server.prepareTransaction(tx);
        prepared.sign(source);

        const sendResponse = await this.server.sendTransaction(prepared);
        if (sendResponse.status === 'ERROR') {
          throw new Error(`Send error: status=ERROR`);
        }

        const receipt = await this.getTransactionWithRetry(sendResponse.hash);
        if (receipt.status === rpc.Api.GetTransactionStatus.SUCCESS) {
          return sendResponse.hash;
        }
        throw new Error(`Transaction failed: ${receipt.status}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(
          `Contract call attempt ${attempt}/${this.maxRetries} failed: ${lastError.message}`,
        );
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    throw lastError ?? new Error('Contract call failed after retries');
  }

  async simulateContract(
    _contractId: string,
    _method: string,
    _args: xdr.ScVal[] = [],
  ): Promise<xdr.ScVal> {
    const source = this.adminKeypair;
    if (!source) {
      throw new Error('No admin keypair configured for simulation');
    }

    const account = await this.server.getAccount(source.publicKey());
    const tx = new TransactionBuilder(account, {
      fee: '100000',
      networkPassphrase: this.networkPassphrase,
    })
      .setTimeout(30)
      .build();

    const simulation = await this.server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(simulation) && simulation.result) {
      return simulation.result.retval;
    }
    if (rpc.Api.isSimulationError(simulation)) {
      throw new Error(`Simulation error: ${simulation.error}`);
    }
    throw new Error('Simulation failed: no result');
  }

  async getContractEvents(
    contractId: string,
    startLedger?: number,
  ): Promise<rpc.Api.EventResponse[]> {
    const response = await this.server.getEvents({
      filters: [{ contractIds: [contractId] }],
      startLedger: startLedger ?? 1,
    });
    return response.events;
  }

  async buildTransaction(
    contractId: string,
    method: string,
    args: xdr.ScVal[],
    sourceKeypair: Keypair,
  ): Promise<string> {
    const account = await this.server.getAccount(sourceKeypair.publicKey());
    const tx = new TransactionBuilder(account, {
      fee: '100000',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: contractId,
          function: method,
          args,
        }),
      )
      .setTimeout(30)
      .build();

    tx.sign(sourceKeypair);
    return tx.toXDR();
  }

  async signAndSend(xdrPayload: string, _keypair: Keypair): Promise<string> {
    const tx = TransactionBuilder.fromXDR(xdrPayload, this.networkPassphrase);
    const sendResponse = await this.server.sendTransaction(tx);
    if (sendResponse.status === 'ERROR') {
      throw new Error(`Send error: status=ERROR`);
    }
    return sendResponse.hash;
  }

  private async getTransactionWithRetry(
    hash: string,
    maxAttempts = 10,
  ): Promise<rpc.Api.GetTransactionResponse> {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await this.server.getTransaction(hash);
      if (response.status !== rpc.Api.GetTransactionStatus.NOT_FOUND) {
        return response;
      }
      await this.delay(1000);
    }
    throw new Error('Transaction not found after max retries');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
