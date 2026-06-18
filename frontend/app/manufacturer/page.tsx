'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface Product {
  id: string;
  name: string;
  sku?: string;
  status: string;
  productType?: string;
  createdAt: string;
}

interface Attestation {
  id: string;
  productId: string;
  productName: string;
  status: string;
  submittedAt: string;
  verifierCount: number;
}

export default function ManufacturerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, recalled: 0 });
  const [pendingAttestations] = useState<Attestation[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [carbonHistory] = useState<{ date: string; footprint: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [productsResult, certResult] = await Promise.all([
        api.getProducts({ limit: 100 }),
        api.getCertificates({ limit: 50 }).catch(() => ({ data: [] as any[], total: 0 })),
      ]);

      const data = productsResult.data ?? [];
      setProducts(data);
      setStats({
        total: productsResult.total ?? 0,
        active: data.filter((p: any) => p.status === 'ACTIVE').length,
        recalled: data.filter((p: any) => p.status === 'RECALLED').length,
      });
      setCertificates(certResult.data ?? []);
    } catch {
      // Loaded with defaults
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    if (typeof window !== 'undefined' && window.freighter) {
      window.freighter
        .getPublicKey()
        .then(setWalletAddress)
        .catch(() => {});
    }
  }, [loadData]);

  const activeProducts = products.filter((p) => p.status === 'ACTIVE');
  const recentProducts = [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Manufacturer Dashboard
          </h1>
          {walletAddress && (
            <p className="mt-1 font-mono text-xs text-gray-500">
              Connected: {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-4 text-center">
          <p className="text-brand-600 dark:text-brand-400 text-3xl font-bold">
            {isLoading ? '...' : stats.total}
          </p>
          <p className="text-sm text-gray-500">Total Products</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{isLoading ? '...' : stats.active}</p>
          <p className="text-sm text-gray-500">Active</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-orange-500">
            {isLoading ? '...' : pendingAttestations.length}
          </p>
          <p className="text-sm text-gray-500">Pending Attestations</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">
            {isLoading ? '...' : certificates.length}
          </p>
          <p className="text-sm text-gray-500">Certificates</p>
        </Card>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
          <TabsTrigger value="attestations">
            Attestations
            {pendingAttestations.length > 0 && (
              <span className="ml-1.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                {pendingAttestations.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="certificates">Certificates ({certificates.length})</TabsTrigger>
          <TabsTrigger value="carbon">Carbon Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
          <Card className="p-6">
            {products.length > 0 ? (
              <div className="space-y-3">
                {recentProducts.map((product) => (
                  <a
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="block rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {product.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {product.sku ?? 'No SKU'} · {product.productType ?? 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {new Date(product.createdAt).toLocaleDateString()}
                        </span>
                        <Badge
                          variant={
                            product.status === 'ACTIVE'
                              ? 'default'
                              : product.status === 'RECALLED'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {product.status}
                        </Badge>
                      </div>
                    </div>
                  </a>
                ))}
                {products.length > 5 && (
                  <a
                    href="/products"
                    className="text-brand-600 dark:text-brand-400 block pt-2 text-center text-sm hover:underline"
                  >
                    View all {products.length} products →
                  </a>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                <p className="mb-2 text-lg">📦</p>
                <p>No products registered yet.</p>
                <p className="mt-1 text-sm">Register your first product to get started.</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="attestations" className="mt-4">
          <Card className="p-6">
            {pendingAttestations.length > 0 ? (
              <div className="space-y-3">
                {pendingAttestations.map((att) => (
                  <div key={att.id} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {att.productName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {att.verifierCount} verifiers assigned · Submitted{' '}
                          {new Date(att.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">{att.status}</Badge>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button className="bg-brand-500 hover:bg-brand-600 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                <p className="mb-2 text-lg">📋</p>
                <p>No pending attestations.</p>
                <p className="mt-1 text-sm">
                  Products that have been submitted for attestation will appear here.
                </p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="mt-4">
          <Card className="p-6">
            {certificates.length > 0 ? (
              <div className="space-y-3">
                {certificates.slice(0, 10).map((cert: any) => (
                  <a
                    key={cert.id}
                    href={`/certificates/${cert.id}`}
                    className="block rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{cert.title}</p>
                        <p className="text-sm text-gray-500">
                          {cert.certType} · {new Date(cert.issuedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={cert.status === 'active' ? 'default' : 'secondary'}>
                        {cert.status}
                      </Badge>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                <p className="mb-2 text-lg">🏷️</p>
                <p>No certificates issued yet.</p>
                <p className="mt-1 text-sm">
                  Complete the attestation process to issue GreenTag certificates.
                </p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="carbon" className="mt-4">
          <Card className="p-6">
            {carbonHistory.length > 0 ? (
              <div className="space-y-3">
                <div className="mb-3 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Carbon footprint history</span>
                  <span>Measured in kg CO₂e</span>
                </div>
                <div className="flex h-48 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-900">
                  <p className="text-gray-400">📊 Carbon trend chart will render here</p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                <p className="mb-2 text-lg">🌱</p>
                <p>No carbon data available yet.</p>
                <p className="mt-1 text-sm">
                  Record lifecycle events to generate carbon footprint data.
                </p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <a
              href="/products"
              className="rounded-lg bg-gray-50 p-3 text-center transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <p className="mb-1 text-lg">📦</p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Register Product
              </p>
            </a>
            <a
              href="/products"
              className="rounded-lg bg-gray-50 p-3 text-center transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <p className="mb-1 text-lg">📋</p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Record Event</p>
            </a>
            <a
              href="/certificates"
              className="rounded-lg bg-gray-50 p-3 text-center transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <p className="mb-1 text-lg">🏷️</p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Issue Certificate
              </p>
            </a>
            <a
              href="/explorer"
              className="rounded-lg bg-gray-50 p-3 text-center transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <p className="mb-1 text-lg">🔗</p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Explore Supply Chain
              </p>
            </a>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Recent Activity
          </h3>
          {activeProducts.length > 0 ? (
            <div className="space-y-2">
              {activeProducts.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <span className="bg-brand-500 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
                  <span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{p.name}</span>{' '}
                    registered
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              No recent activity
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
