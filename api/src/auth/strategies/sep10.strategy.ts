import { Injectable, Logger } from '@nestjs/common';
import { Keypair, TransactionBuilder, Operation, Transaction } from '@stellar/stellar-sdk';

export interface Sep10Config {
  signingKey: string;
  homeDomain: string;
  networkPassphrase: string;
}

export interface ChallengeResult {
  transactionXdr: string;
  publicKey: string;
}

@Injectable()
export class Sep10Strategy {
  private readonly logger = new Logger(Sep10Strategy.name);
  private readonly signingKeypair: Keypair;

  constructor(private readonly config: Sep10Config) {
    this.signingKeypair = Keypair.fromSecret(config.signingKey);
  }

  generateChallenge(clientPublicKey: string): ChallengeResult {
    const tx = new TransactionBuilder(
      { accountId: () => this.signingKeypair.publicKey(), sequenceNumber: '0' } as any,
      {
        fee: '100',
        networkPassphrase: this.config.networkPassphrase,
      },
    )
      .addOperation(
        Operation.manageData({
          name: `${this.config.homeDomain} auth`,
          value: this.randomBytes(32),
        }),
      )
      .addOperation(
        Operation.setOptions({
          source: clientPublicKey,
          signer: {
            ed25519PublicKey: clientPublicKey,
            weight: 1,
          },
        }),
      )
      .setTimeout(300)
      .build();

    tx.sign(this.signingKeypair);

    return {
      transactionXdr: tx.toXDR(),
      publicKey: this.signingKeypair.publicKey(),
    };
  }

  verifyChallenge(signedXdr: string): { publicKey: string; valid: boolean } {
    try {
      const tx = TransactionBuilder.fromXDR(signedXdr, this.config.networkPassphrase) as Transaction;
      const sourceAccount = tx.source;

      const hash = tx.hash();
      const verified = tx.signatures.some((sig) => {
        try {
          const keypair = Keypair.fromPublicKey(sourceAccount);
          return keypair.verify(hash as unknown as Buffer, sig.signature as unknown as Buffer);
        } catch {
          return false;
        }
      });

      if (!verified) {
        return { publicKey: sourceAccount, valid: false };
      }

      return { publicKey: sourceAccount, valid: true };
    } catch (error) {
      this.logger.error(`Challenge verification failed: ${error instanceof Error ? error.message : String(error)}`);
      return { publicKey: '', valid: false };
    }
  }

  getServerPublicKey(): string {
    return this.signingKeypair.publicKey();
  }

  private randomBytes(length: number): Buffer {
    const hex = Array.from({ length }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0'),
    ).join('');
    return Buffer.from(hex, 'hex');
  }
}
