import { Networks } from '@stellar/stellar-sdk';
import {
  isFreighterInstalled,
  isFreighterConnected,
  getFreighterPublicKey,
  signFreighterTransaction,
  getNetworkPassphrase,
} from '../lib/freighter';

describe('freighter wallet helpers', () => {
  const originalWindow = (global as any).window;

  beforeEach(() => {
    (global as any).window = {};
  });

  afterEach(() => {
    (global as any).window = originalWindow;
    jest.restoreAllMocks();
  });

  describe('isFreighterInstalled', () => {
    it('should return false if window.freighter is undefined', async () => {
      delete (global as any).window.freighter;
      const result = await isFreighterInstalled();
      expect(result).toBe(false);
    });

    it('should return false if window is undefined', async () => {
      delete (global as any).window;
      const result = await isFreighterInstalled();
      expect(result).toBe(false);
    });

    it('should return true if window.freighter is present', async () => {
      (global as any).window.freighter = {};
      const result = await isFreighterInstalled();
      expect(result).toBe(true);
    });
  });

  describe('isFreighterConnected', () => {
    it('should return false if freighter is not installed', async () => {
      delete (global as any).window.freighter;
      const result = await isFreighterConnected();
      expect(result).toBe(false);
    });

    it('should return true if freighter reports isConnected=true', async () => {
      (global as any).window.freighter = {
        isConnected: jest.fn().mockResolvedValue({ isConnected: true }),
      };
      const result = await isFreighterConnected();
      expect(result).toBe(true);
    });

    it('should return false if freighter isConnected check rejects', async () => {
      (global as any).window.freighter = {
        isConnected: jest.fn().mockRejectedValue(new Error('Extension error')),
      };
      const result = await isFreighterConnected();
      expect(result).toBe(false);
    });
  });

  describe('getFreighterPublicKey', () => {
    it('should throw error when freighter is not installed', async () => {
      delete (global as any).window.freighter;
      await expect(getFreighterPublicKey()).rejects.toThrow('Freighter wallet not installed');
    });

    it('should throw error when freighter is not connected', async () => {
      (global as any).window.freighter = {
        isConnected: jest.fn().mockResolvedValue({ isConnected: false }),
        getPublicKey: jest.fn(),
      };
      await expect(getFreighterPublicKey()).rejects.toThrow('Freighter wallet not connected');
    });

    it('should return public key when connected', async () => {
      (global as any).window.freighter = {
        isConnected: jest.fn().mockResolvedValue({ isConnected: true }),
        getPublicKey: jest
          .fn()
          .mockResolvedValue('GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H'),
      };
      const key = await getFreighterPublicKey();
      expect(key).toBe('GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H');
    });
  });

  describe('signFreighterTransaction', () => {
    it('should throw error when freighter is not installed', async () => {
      delete (global as any).window.freighter;
      await expect(signFreighterTransaction('AAAA_XDR')).rejects.toThrow(
        'Freighter wallet not installed',
      );
    });

    it('should call signTransaction with default testnet passphrase', async () => {
      const signTransactionMock = jest.fn().mockResolvedValue('AAAA_SIGNED_XDR');
      (global as any).window.freighter = {
        signTransaction: signTransactionMock,
      };

      const result = await signFreighterTransaction('AAAA_XDR');
      expect(signTransactionMock).toHaveBeenCalledWith('AAAA_XDR', {
        networkPassphrase: Networks.TESTNET,
      });
      expect(result).toBe('AAAA_SIGNED_XDR');
    });

    it('should call signTransaction with custom passphrase when supplied', async () => {
      const signTransactionMock = jest.fn().mockResolvedValue('AAAA_SIGNED_XDR');
      (global as any).window.freighter = {
        signTransaction: signTransactionMock,
      };

      const result = await signFreighterTransaction('AAAA_XDR', Networks.PUBLIC);
      expect(signTransactionMock).toHaveBeenCalledWith('AAAA_XDR', {
        networkPassphrase: Networks.PUBLIC,
      });
      expect(result).toBe('AAAA_SIGNED_XDR');
    });
  });

  describe('getNetworkPassphrase', () => {
    it('should return testnet passphrase', async () => {
      const passphrase = await getNetworkPassphrase();
      expect(passphrase).toBe(Networks.TESTNET);
    });
  });
});
