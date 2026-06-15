'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
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

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    q: searchParams.get('q') ?? '',
    type: searchParams.get('type') ?? '',
    origin: searchParams.get('origin') ?? '',
    sort: 'newest' as string,
  });
  const limit = 12;

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.getProducts({
        q: filters.q || undefined,
        type: filters.type || undefined,
        origin: filters.origin || undefined,
        sort: filters.sort,
        page,
        limit,
      });
      setProducts(result.data ?? []);
      setTotal(result.total ?? 0);
    } catch {
      setProducts([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Products
          {total > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">({total} total)</span>
          )}
        </h1>
      </div>

      <div className="flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search products..."
          value={filters.q}
          onChange={(e) => {
            setFilters({ ...filters, q: e.target.value });
            setPage(1);
          }}
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
        />
        <select
          value={filters.type}
          onChange={(e) => {
            setFilters({ ...filters, type: e.target.value });
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm"
        >
          <option value="">All Types</option>
          <option value="apparel">Apparel</option>
          <option value="electronics">Electronics</option>
          <option value="packaging">Packaging</option>
          <option value="construction">Construction</option>
          <option value="home">Home</option>
          <option value="industrial">Industrial</option>
          <option value="goods">Goods</option>
        </select>
        <select
          value={filters.origin}
          onChange={(e) => {
            setFilters({ ...filters, origin: e.target.value });
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm"
        >
          <option value="">All Origins</option>
          <option value="Portugal">Portugal</option>
          <option value="Sweden">Sweden</option>
          <option value="Germany">Germany</option>
          <option value="Canada">Canada</option>
          <option value="USA">USA</option>
          <option value="Brazil">Brazil</option>
        </select>
        <select
          value={filters.sort}
          onChange={(e) => {
            setFilters({ ...filters, sort: e.target.value });
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">Name</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    p === page
                      ? 'bg-brand-500 text-white'
                      : 'border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          No products found matching your criteria.
        </div>
      )}
    </div>
  );
}
