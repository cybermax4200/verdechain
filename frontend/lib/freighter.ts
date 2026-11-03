import { Networks } from '@stellar/stellar-sdk';

export interface FreighterError {
  code: number;
  message: string;
}

export async function isFreighterInstalled(): Promise<boolean> {
  try {
    return typeof window !== 'undefined' && (window as any).freighter !== undefined;
  } catch {
    return false;
  }
}

export async function getFreighterPublicKey(): Promise<string> {
  if (typeof window === 'undefined' || !(window as any).freighter) {
    throw new Error('Freighter wallet not installed');
  }
  const { isConnected } = await (window as any).freighter.isConnected();
  if (!isConnected) {
    throw new Error('Freighter wallet not connected');
  }
  return (window as any).freighter.getPublicKey();
}

export async function isFreighterConnected(): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !(window as any).freighter) {
      return false;
    }
    const { isConnected } = await (window as any).freighter.isConnected();
    return isConnected;
  } catch {
    return false;
  }
}

export async function signFreighterTransaction(
  xdr: string,
  networkPassphrase = Networks.TESTNET,
): Promise<string> {
  if (typeof window === 'undefined' || !(window as any).freighter) {
    throw new Error('Freighter wallet not installed');
  }
  return (window as any).freighter.signTransaction(xdr, {
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

export async function loginWithFreighter(
  requestFn?: (config: any) => Promise<any>,
): Promise<{ publicKey: string; token?: string }> {
  const publicKey = await getFreighterPublicKey();
  if (!requestFn) {
    return { publicKey };
  }
  try {
    const challenge = await requestFn({
      method: 'POST',
      url: '/auth/challenge',
      data: { publicKey },
    });
    if (challenge?.challengeXdr) {
      const signedXdr = await signFreighterTransaction(challenge.challengeXdr);
      const verifyRes = await requestFn({
        method: 'POST',
        url: '/auth/verify',
        data: { signedXdr },
      });
      return { publicKey, token: verifyRes.jwt };
    }
  } catch {
    // Graceful fallback to address-only connection if backend auth is offline
  }
  return { publicKey };
}
