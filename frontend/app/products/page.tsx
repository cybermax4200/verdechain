'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
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

function ProductsList() {
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
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Products
          {total > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">({total} total)</span>
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
          className="focus:ring-brand-500 min-w-[200px] flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 dark:border-gray-700 dark:bg-gray-900"
        />
        <select
          value={filters.type}
          onChange={(e) => {
            setFilters({ ...filters, type: e.target.value });
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
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
          className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
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
          className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">Name</option>
        </select>
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
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-900"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    p === page
                      ? 'bg-brand-500 text-white'
                      : 'border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-900"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="py-16 text-center text-gray-500 dark:text-gray-400">
          No products found matching your criteria.
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="mb-3 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="mb-2 h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        </div>
      }
    >
      <ProductsList />
    </Suspense>
  );
}
