'use client';

import { useState, useEffect } from 'react';

declare global {
  interface Window {
    freighter?: {
      isConnected: () => Promise<{ isConnected: boolean }>;
      getPublicKey: () => Promise<string>;
      signTransaction: (xdr: string, opts?: { networkPassphrase: string }) => Promise<string>;
    };
  }
}

export function WalletConnector() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      if (window.freighter) {
        const { isConnected } = await window.freighter.isConnected();
        if (isConnected) {
          const key = await window.freighter.getPublicKey();
          setPublicKey(key);
        }
      }
    } catch {
      // Freighter not available
    }
  };

  const connect = async () => {
    setIsConnecting(true);
    try {
      if (!window.freighter) {
        window.open('https://freighter.app', '_blank');
        return;
      }
      const key = await window.freighter.getPublicKey();
      setPublicKey(key);
    } catch (error) {
      console.error('Failed to connect Freighter:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setPublicKey(null);
  };

  if (publicKey) {
    return (
      <div className="flex items-center gap-2">
        <div className="bg-brand-50 dark:bg-brand-950 border-brand-200 dark:border-brand-800 flex items-center gap-2 rounded-lg border px-3 py-1.5">
          <div className="bg-brand-500 h-2 w-2 rounded-full" />
          <span className="text-brand-700 dark:text-brand-300 font-mono text-xs">
            {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
          </span>
        </div>
        <button
          onClick={disconnect}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className="bg-brand-500 hover:bg-brand-600 rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
