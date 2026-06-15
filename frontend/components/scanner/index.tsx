'use client';

import { useState } from 'react';

interface ScannerProps {
  onResult: (result: string) => void;
  onClose: () => void;
}

export function Scanner({ onResult, onClose }: ScannerProps) {
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onResult(manualInput.trim());
    } else {
      setError('Please enter a product ID or URL');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Scan Product QR</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      <div className="aspect-square max-w-xs mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">📷</div>
          <p className="text-sm">Camera access needed</p>
          <p className="text-xs mt-1">Or enter the code manually below</p>
        </div>
      </div>

      <form onSubmit={handleManualSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Product ID or verification URL"
          value={manualInput}
          onChange={(e) => {
            setManualInput(e.target.value);
            setError(null);
          }}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          className="w-full py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          Look Up Product
        </button>
      </form>
    </div>
  );
}
