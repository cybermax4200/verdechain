'use client';

import './globals.css';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { WalletConnector } from '@/components/wallet-connector';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <html lang="en" className={cn(isDark && 'dark')}>
      <body className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-8">
                <a href="/" className="flex items-center gap-2">
                  <div className="bg-brand-500 flex h-8 w-8 items-center justify-center rounded-lg">
                    <span className="text-sm font-bold text-white">V</span>
                  </div>
                  <span className="text-brand-700 dark:text-brand-400 text-xl font-bold">
                    VerdeChain
                  </span>
                </a>
                <div className="hidden items-center gap-6 md:flex">
                  <a
                    href="/products"
                    className="hover:text-brand-600 dark:hover:text-brand-400 text-sm font-medium text-gray-600 transition-colors dark:text-gray-400"
                  >
                    Products
                  </a>
                  <a
                    href="/certificates"
                    className="hover:text-brand-600 dark:hover:text-brand-400 text-sm font-medium text-gray-600 transition-colors dark:text-gray-400"
                  >
                    Certificates
                  </a>
                  <a
                    href="/explorer"
                    className="hover:text-brand-600 dark:hover:text-brand-400 text-sm font-medium text-gray-600 transition-colors dark:text-gray-400"
                  >
                    Explorer
                  </a>
                  <a
                    href="/manufacturer"
                    className="hover:text-brand-600 dark:hover:text-brand-400 text-sm font-medium text-gray-600 transition-colors dark:text-gray-400"
                  >
                    Dashboard
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <form onSubmit={handleSearch} className="hidden sm:block">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="focus:ring-brand-500 w-48 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 lg:w-64 dark:border-gray-700 dark:bg-gray-900"
                  />
                </form>
                <button
                  onClick={() => setIsDark(!isDark)}
                  className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  aria-label="Toggle theme"
                >
                  {isDark ? '☀️' : '🌙'}
                </button>
                <WalletConnector />
              </div>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
