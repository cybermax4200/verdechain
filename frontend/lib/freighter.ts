import { Networks } from '@stellar/stellar-sdk';

export interface FreighterError {
  code: number;
  message: string;
}

export async function isFreighterInstalled(): Promise<boolean> {
  try {
    return window.freighter !== undefined;
  } catch {
    return false;
  }
}

export async function getFreighterPublicKey(): Promise<string> {
  if (!window.freighter) {
    throw new Error('Freighter wallet not installed');
  }
  const { isConnected } = await window.freighter.isConnected();
  if (!isConnected) {
    throw new Error('Freighter wallet not connected');
  }
  return window.freighter.getPublicKey();
}

export async function isFreighterConnected(): Promise<boolean> {
  try {
    if (!window.freighter) {
      return false;
    }
    const { isConnected } = await window.freighter.isConnected();
    return isConnected;
  } catch {
    return false;
  }
}

export async function signFreighterTransaction(
  xdr: string,
  networkPassphrase = Networks.TESTNET,
): Promise<string> {
  if (!window.freighter) {
    throw new Error('Freighter wallet not installed');
  }
  return window.freighter.signTransaction(xdr, {
    networkPassphrase,
  });
}

export async function getNetworkPassphrase(): Promise<string> {
  try {
    return Networks.TESTNET;
  } catch {
    return Networks.TESTNET;
  }
}
