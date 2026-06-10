import { Injectable, Logger } from '@nestjs/common';
import { Keypair, Horizon } from '@stellar/stellar-sdk';

export interface WalletConfig {
  horizonUrl: string;
  networkPassphrase: string;
  friendbotUrl?: string;
}

export interface GeneratedWallet {
  publicKey: string;
  secretKey: string;
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private readonly horizonServer: Horizon.Server;

  constructor(private readonly config: WalletConfig) {
    this.horizonServer = new Horizon.Server(config.horizonUrl);
  }

  generateKeypair(): GeneratedWallet {
    const keypair = Keypair.random();
    return {
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
    };
  }

  async fundTestnetWallet(publicKey: string): Promise<boolean> {
    const friendbotUrl =
      this.config.friendbotUrl ?? 'https://friendbot.stellar.org';
    try {
      const response = await fetch(
        `${friendbotUrl}?addr=${publicKey}`,
        { method: 'GET' },
      );
      if (!response.ok) {
        throw new Error(`Friendbot responded with ${response.status}`);
      }
      this.logger.log(`Funded wallet ${publicKey} via Friendbot`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to fund wallet ${publicKey}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  async getBalance(publicKey: string): Promise<Array<{ asset: string; balance: string }>> {
    try {
      const account = await this.horizonServer
        .accounts()
        .accountId(publicKey)
        .call();
      return account.balances.map((b) => {
        if (b.asset_type === 'native') {
          return { asset: 'XLM', balance: b.balance };
        }
        if ('asset_code' in b && 'asset_issuer' in b) {
          return {
            asset: `${b.asset_code}:${b.asset_issuer}`,
            balance: b.balance,
          };
        }
        return { asset: b.asset_type, balance: b.balance };
      });
    } catch (error) {
      this.logger.error(
        `Failed to get balance for ${publicKey}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async getKeypairFromSecret(secretKey: string): Promise<Keypair> {
    try {
      return Keypair.fromSecret(secretKey);
    } catch (error) {
      throw new Error(
        `Invalid secret key: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async verifyKeypair(publicKey: string, secretKey: string): Promise<boolean> {
    try {
      const keypair = Keypair.fromSecret(secretKey);
      return keypair.publicKey() === publicKey;
    } catch {
      return false;
    }
  }

  generateSigningKey(): GeneratedWallet {
    return this.generateKeypair();
  }

  signMessage(message: string, secretKey: string): string {
    const keypair = Keypair.fromSecret(secretKey);
    const signature = keypair.sign(Buffer.from(message));
    return signature.toString('base64');
  }

  verifySignature(
    message: string,
    signature: string,
    publicKey: string,
  ): boolean {
    try {
      const keypair = Keypair.fromPublicKey(publicKey);
      return keypair.verify(
        Buffer.from(message),
        Buffer.from(signature, 'base64'),
      );
    } catch {
      return false;
    }
  }
}
