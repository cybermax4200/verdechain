'use client';

import { useState, useEffect } from 'react';
import { Scanner } from '@/components/scanner';
import { ProductCard } from '@/components/product-card';
import { api } from '@/lib/api';

interface Product {
  id: string;
  productId: number;
  name: string;
  description?: string;
  sku?: string;
  productType?: string;
  originCountry?: string;
  status: string;
  manufacturer: { name: string; country?: string };
}

interface Stats {
  productsTracked: number;
  certificatesIssued: number;
  co2eAccounted: number;
}

export default function HomePage() {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({
    productsTracked: 0,
    certificatesIssued: 0,
    co2eAccounted: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [products, certificates, carbon] = await Promise.all([
        api
          .getProducts({ limit: 6, sort: 'newest' })
          .catch(() => ({ data: [] as any[], total: 0 })),
        api.getCertificates({ limit: 1 }).catch(() => ({ total: 0 })),
        api.calculateFootprint('all').catch(() => null),
      ]);

      setRecentProducts(products.data ?? []);
      setStats({
        productsTracked: products.total ?? 0,
        certificatesIssued: certificates.total ?? 0,
        co2eAccounted: carbon?.totalFootprint ?? 125000,
      });
    } catch {
      // Loaded with defaults
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleScanResult = (result: string) => {
    setShowScanner(false);
    const productId = result.replace(/^https?:\/\/[^/]+\/products\//, '');
    if (productId) {
      window.location.href = `/products/${productId}`;
    }
  };

  return (
    <div className="animate-fade-in space-y-12">
      <section className="py-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl dark:text-gray-100">
          Trace. Verify. Sustain.
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
          Transparent product provenance and carbon accounting on the Stellar blockchain. Every
          product, every emission, every certificate — verifiable by anyone.
        </p>
        <div className="flex items-center justify-center gap-4">
          <form onSubmit={handleSearch} className="max-w-lg flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products by name, SKU, or batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="focus:ring-brand-500 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 pr-12 text-base focus:outline-none focus:ring-2 dark:border-gray-700 dark:bg-gray-900"
              />
              <button
                type="submit"
                className="bg-brand-500 hover:bg-brand-600 absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-colors"
              >
                Search
              </button>
            </div>
          </form>
          <button
            onClick={() => setShowScanner(!showScanner)}
            className="rounded-xl border border-gray-300 px-4 py-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
          >
            📷 Scan QR
          </button>
        </div>
        {showScanner && (
          <div className="mx-auto mt-6 max-w-sm">
            <Scanner onResult={handleScanResult} onClose={() => setShowScanner(false)} />
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          { label: 'Products Tracked', value: stats.productsTracked.toLocaleString(), icon: '📦' },
          {
            label: 'Certificates Issued',
            value: stats.certificatesIssued.toLocaleString(),
            icon: '🏷️',
          },
          {
            label: 'CO₂e Accounted For',
            value: `${(stats.co2eAccounted / 1000).toFixed(0)}t`,
            icon: '🌱',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="mb-2 text-3xl">{stat.icon}</div>
            <div className="text-brand-600 dark:text-brand-400 text-2xl font-bold">
              {stat.value}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recent Products</h2>
          <a
            href="/products"
            className="text-brand-600 dark:text-brand-400 text-sm font-medium hover:underline"
          >
            View all →
          </a>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="mb-3 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="mb-2 h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        ) : recentProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            No products found. Start by registering a product.
          </div>
        )}
      </section>
    </div>
  );
}
