import { Injectable, Logger } from '@nestjs/common';
import { Horizon } from '@stellar/stellar-sdk';

export interface HorizonClientConfig {
  horizonUrl: string;
  networkPassphrase: string;
}

@Injectable()
export class HorizonClientService {
  private readonly logger = new Logger(HorizonClientService.name);
  private readonly server: Horizon.Server;

  constructor(_config: HorizonClientConfig) {
    this.server = new Horizon.Server(_config.horizonUrl);
  }

  async getAccount(publicKey: string) {
    try {
      return await this.server.accounts().accountId(publicKey).call();
    } catch (error) {
      this.logger.error(
        `Failed to fetch account ${publicKey}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async getTransactions(
    accountId?: string,
    options?: {
      limit?: number;
      order?: 'asc' | 'desc';
      cursor?: string;
    },
  ) {
    const builder = this.server.transactions();
    if (accountId) {
      builder.forAccount(accountId);
    }
    if (options?.limit) {
      builder.limit(options.limit);
    }
    if (options?.order) {
      builder.order(options.order);
    }
    if (options?.cursor) {
      builder.cursor(options.cursor);
    }

    return builder.call();
  }

  async getOperations(transactionHash: string) {
    return this.server.operations().forTransaction(transactionHash).call();
  }

  async getPayments(
    accountId: string,
    options?: {
      limit?: number;
      cursor?: string;
    },
  ) {
    const builder = this.server.payments().forAccount(accountId);
    if (options?.limit) {
      builder.limit(options.limit);
    }
    if (options?.cursor) {
      builder.cursor(options.cursor);
    }
    return builder.call();
  }

  async streamTransactions(
    accountId: string,
    cursor: string,
    onMessage: (tx: Horizon.ServerApi.TransactionRecord) => void,
  ): Promise<void> {
    this.server
      .transactions()
      .forAccount(accountId)
      .cursor(cursor)
      .stream({
        onmessage: (tx) => {
          onMessage(tx);
        },
      });
  }

  async getLedger(sequence: number) {
    return this.server.ledgers().ledger(sequence).call();
  }

  async getLatestLedger(): Promise<number> {
    const root = await this.server.root();
    return parseInt(root.horizon_version ?? '0', 10);
  }

  async checkAccountExists(publicKey: string): Promise<boolean> {
    try {
      await this.getAccount(publicKey);
      return true;
    } catch {
      return false;
    }
  }
}
