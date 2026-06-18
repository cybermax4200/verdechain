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
  const i32 = val.i32();
  if (i32 !== undefined) {
    return i32;
  }
  const u32 = val.u32();
  if (u32 !== undefined) {
    return u32;
  }
  const i64 = val.i64();
  if (i64 !== undefined) {
    return Number(i64);
  }
  const u64 = val.u64();
  if (u64 !== undefined) {
    return Number(u64);
  }
  return 0;
}
