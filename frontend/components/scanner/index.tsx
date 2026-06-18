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
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Scan Product QR</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      <div className="mx-auto mb-4 flex aspect-square max-w-xs items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
        <div className="text-center text-gray-400">
          <div className="mb-2 text-4xl">📷</div>
          <p className="text-sm">Camera access needed</p>
          <p className="mt-1 text-xs">Or enter the code manually below</p>
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
          className="focus:ring-brand-500 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 dark:border-gray-700 dark:bg-gray-900"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          className="bg-brand-500 hover:bg-brand-600 w-full rounded-lg py-2 text-sm font-medium text-white transition-colors"
        >
          Look Up Product
        </button>
      </form>
    </div>
  );
}
