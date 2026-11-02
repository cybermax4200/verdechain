import { rpc, TransactionBuilder, Operation, xdr, Networks } from '@stellar/stellar-sdk';

export interface StellarConfig {
  sorobanRpc: string;
  networkPassphrase?: string;
}

export interface ContractAddresses {
  productRegistry?: string;
  lifecycleTracker?: string;
  attestation?: string;
  greenTagCert?: string;
  verifierRegistry?: string;
  carbonOracle?: string;
}

export class StellarBrowserClient {
  private server: rpc.Server;
  private networkPassphrase: string;

  constructor(config: StellarConfig) {
    this.server = new rpc.Server(config.sorobanRpc);
    this.networkPassphrase = config.networkPassphrase ?? Networks.TESTNET;
  }

  async callContract(
    contractId: string,
    method: string,
    args: xdr.ScVal[] = [],
    publicKey: string,
  ): Promise<string> {
    const account = await this.server.getAccount(publicKey);

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

    return prepared.toXDR();
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

  async getTransaction(hash: string) {
    return this.server.getTransaction(hash);
  }

  getNetworkPassphrase(): string {
    return this.networkPassphrase;
  }
}

export function scValToString(val: xdr.ScVal): string {
  switch (val.switch().name) {
    case 'scvSymbol':
      return val.sym().toString();
    case 'scvString':
      return val.str().toString();
    default:
      return val.toXDR('base64');
  }
}

export function scValToNumber(val: xdr.ScVal): number {
  switch (val.switch().name) {
    case 'scvI32':
      return val.i32();
    case 'scvU32':
      return val.u32();
    case 'scvI64':
      return Number(val.i64());
    case 'scvU64':
      return Number(val.u64());
    default:
      return 0;
  }
}
