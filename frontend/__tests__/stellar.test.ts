import {
  xdr,
  Networks,
} from '@stellar/stellar-sdk';
import { StellarBrowserClient, scValToString, scValToNumber } from '../lib/stellar';

jest.mock('@stellar/stellar-sdk', () => {
  const actual = jest.requireActual('@stellar/stellar-sdk');
  return {
    ...actual,
    rpc: {
      Server: jest.fn().mockImplementation(() => ({
        getAccount: jest.fn().mockResolvedValue(
          new actual.Account('GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H', '100'),
        ),
        prepareTransaction: jest.fn().mockImplementation((_tx: any) =>
          Promise.resolve({
            toXDR: () => 'AAAA_PREPARED_XDR_MOCK',
          }),
        ),
        getEvents: jest.fn().mockResolvedValue({
          events: [{ id: 'evt-1', type: 'contract' }],
        }),
        getTransaction: jest.fn().mockResolvedValue({
          status: 'SUCCESS',
          hash: 'tx-hash-123',
        }),
      })),
    },
  };
});

describe('frontend stellar utilities', () => {
  describe('scValToString', () => {
    it('should convert scvSymbol to string', () => {
      const val = xdr.ScVal.scvSymbol('APPROVED');
      expect(scValToString(val)).toBe('APPROVED');
    });

    it('should convert scvString to string', () => {
      const val = xdr.ScVal.scvString('QmEvidenceHash');
      expect(scValToString(val)).toBe('QmEvidenceHash');
    });

    it('should fallback to base64 for other ScVal types', () => {
      const val = xdr.ScVal.scvBool(true);
      const str = scValToString(val);
      expect(typeof str).toBe('string');
      expect(str.length).toBeGreaterThan(0);
    });
  });

  describe('scValToNumber', () => {
    it('should parse i32 value', () => {
      const val = xdr.ScVal.scvI32(42);
      expect(scValToNumber(val)).toBe(42);
    });

    it('should parse u32 value', () => {
      const val = xdr.ScVal.scvU32(1234);
      expect(scValToNumber(val)).toBe(1234);
    });

    it('should parse i64 value', () => {
      const val = xdr.ScVal.scvI64(xdr.Int64.fromString('500'));
      expect(scValToNumber(val)).toBe(500);
    });

    it('should parse u64 value', () => {
      const val = xdr.ScVal.scvU64(xdr.Uint64.fromString('999'));
      expect(scValToNumber(val)).toBe(999);
    });

    it('should return 0 for non-numeric ScVal types', () => {
      const val = xdr.ScVal.scvBool(false);
      expect(scValToNumber(val)).toBe(0);
    });
  });

  describe('StellarBrowserClient', () => {
    it('should use default TESTNET network passphrase if omitted', () => {
      const client = new StellarBrowserClient({ sorobanRpc: 'https://soroban-testnet.stellar.org' });
      expect(client.getNetworkPassphrase()).toBe(Networks.TESTNET);
    });

    it('should accept custom network passphrase', () => {
      const client = new StellarBrowserClient({
        sorobanRpc: 'https://soroban-public.stellar.org',
        networkPassphrase: Networks.PUBLIC,
      });
      expect(client.getNetworkPassphrase()).toBe(Networks.PUBLIC);
    });

    it('should call contract function and return prepared transaction XDR', async () => {
      const client = new StellarBrowserClient({ sorobanRpc: 'https://soroban-testnet.stellar.org' });
      const xdrResult = await client.callContract(
        'CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE',
        'register_product',
        [],
        'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
      );

      expect(xdrResult).toBe('AAAA_PREPARED_XDR_MOCK');
    });

    it('should get contract events with optional startLedger', async () => {
      const client = new StellarBrowserClient({ sorobanRpc: 'https://soroban-testnet.stellar.org' });
      const events = await client.getContractEvents('CABC123', 100);

      expect(events).toHaveLength(1);
      expect(events[0]?.id).toBe('evt-1');
    });

    it('should get transaction status by hash', async () => {
      const client = new StellarBrowserClient({ sorobanRpc: 'https://soroban-testnet.stellar.org' });
      const tx = await client.getTransaction('tx-hash-123');

      expect(tx).toEqual({
        status: 'SUCCESS',
        hash: 'tx-hash-123',
      });
    });
  });
});
