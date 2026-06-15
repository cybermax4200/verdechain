'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api, CarbonFootprint, LifecycleEvent } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface ProductDetail {
  id: string;
  productId: number;
  name: string;
  description?: string;
  sku?: string;
  batchNumber?: string;
  productType?: string;
  originCountry?: string;
  ipfsHash?: string;
  status: string;
  manufacturer: { id: string; name: string; publicKey: string; country?: string };
  createdAt: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [lifecycle, setLifecycle] = useState<LifecycleEvent[]>([]);
  const [carbon, setCarbon] = useState<CarbonFootprint[]>([]);
  const [certificates, setCertificates] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProduct();
  }, [params.id]);

  const loadProduct = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const id = params.id as string;
      const [productData, lifecycleData, carbonData, certData] = await Promise.all([
        api.getProduct(id),
        api.getLifecycle(id).catch(() => []),
        api.getCarbonFootprint(id).catch(() => []),
        api.getCertificatesByProduct(id).catch(() => []),
      ]);
      setProduct(productData);
      setLifecycle(lifecycleData);
      setCarbon(carbonData);
      setCertificates(certData);
    } catch {
      setError('Failed to load product details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500">{error ?? 'Product not found'}</p>
        <a href="/products" className="text-brand-600 hover:underline mt-4 inline-block">
          ← Back to products
        </a>
      </div>
    );
  }

  const latestCarbon = carbon[0];
  const carbonByStage = latestCarbon?.breakdown as Record<string, number> | undefined;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <a href="/products" className="text-sm text-brand-600 dark:text-brand-400 hover:underline mb-2 inline-block">
          ← Back to products
        </a>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{product.name}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
              {product.sku && <span>SKU: {product.sku}</span>}
              {product.batchNumber && <span>Batch: {product.batchNumber}</span>}
              {product.productType && (
                <Badge variant="secondary">{product.productType}</Badge>
              )}
              <Badge variant={product.status === 'ACTIVE' ? 'default' : 'destructive'}>
                {product.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Product Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manufacturer</p>
                <p className="font-medium">{product.manufacturer.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Origin</p>
                <p className="font-medium">{product.originCountry ?? 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Product ID</p>
                <p className="font-medium font-mono">#{product.productId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Registered</p>
                <p className="font-medium">{new Date(product.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            {product.description && (
              <p className="text-gray-600 dark:text-gray-300 mt-4">{product.description}</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Carbon Footprint</h2>
          {latestCarbon ? (
            <div className="space-y-3">
              <div className="text-3xl font-bold text-brand-600 dark:text-brand-400">
                {(latestCarbon.totalFootprint ?? 0).toFixed(1)}
                <span className="text-sm font-normal text-gray-500 ml-1">kg CO₂e</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Scope 1 (Direct)</span>
                  <span className="font-medium">{latestCarbon.scope1.toFixed(1)} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Scope 2 (Energy)</span>
                  <span className="font-medium">{latestCarbon.scope2.toFixed(1)} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Scope 3 (Supply Chain)</span>
                  <span className="font-medium">{latestCarbon.scope3.toFixed(1)} kg</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Confidence: {latestCarbon.confidenceScore ?? 'N/A'}% · {latestCarbon.methodology}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No carbon data available</p>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Lifecycle Timeline</h2>
        {lifecycle.length > 0 ? (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800" />
            <div className="space-y-6">
              {lifecycle.map((event, index) => (
                <div key={event.id ?? index} className="relative pl-10">
                  <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-brand-500 border-2 border-white dark:border-gray-950" />
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                          {event.stage?.replace(/_/g, ' ').toLowerCase()}
                        </p>
                        {event.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{event.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {event.timestamp ? new Date(event.timestamp).toLocaleDateString() : ''}
                      </span>
                    </div>
                    {event.location && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">📍 {event.location}</p>
                    )}
                    {(event.energyKwh || event.fuelUsed || event.wasteKg) && (
                      <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {event.energyKwh && <span>⚡ {event.energyKwh} kWh</span>}
                        {event.fuelUsed && <span>⛽ {event.fuelUsed} L</span>}
                        {event.wasteKg && <span>🗑️ {event.wasteKg} kg</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No lifecycle events recorded</p>
        )}
      </Card>

      <Tabs defaultValue="breakdown">
        <TabsList>
          <TabsTrigger value="breakdown">Emissions Breakdown</TabsTrigger>
          <TabsTrigger value="certificates">Certificates ({certificates.length})</TabsTrigger>
          <TabsTrigger value="provenance">Provenance</TabsTrigger>
        </TabsList>
        <TabsContent value="breakdown" className="mt-4">
          <Card className="p-6">
            {carbonByStage ? (
              <div className="space-y-3">
                <h3 className="font-semibold mb-3">Emissions by Lifecycle Stage</h3>
                {Object.entries(carbonByStage).map(([stage, value]) => (
                  <div key={stage} className="flex items-center gap-3">
                    <span className="text-sm w-48 capitalize">{stage.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all"
                        style={{ width: `${(value / (latestCarbon?.totalFootprint ?? 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-20 text-right">{value.toFixed(1)} kg</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No breakdown data available</p>
            )}
          </Card>
        </TabsContent>
        <TabsContent value="certificates" className="mt-4">
          <Card className="p-6">
            {certificates.length > 0 ? (
              <div className="space-y-3">
                {certificates.map((cert: any) => (
                  <div key={cert.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div>
                      <p className="font-medium">{cert.title}</p>
                      <p className="text-sm text-gray-500">{cert.certType} · {new Date(cert.issuedAt).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={cert.status === 'active' ? 'default' : 'secondary'}>
                      {cert.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No certificates issued</p>
            )}
          </Card>
        </TabsContent>
        <TabsContent value="provenance" className="mt-4">
          <Card className="p-6">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Interactive provenance graph will be rendered here using D3.js.
              Shows the complete supply chain journey from raw materials to retail.
            </p>
            <div className="mt-4 h-48 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center text-gray-400">
              Provenance Graph (D3.js) — Coming in Day 15
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-center py-4">
        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
          Product ID: {product.id} | On-chain verification available
        </p>
      </div>
    </div>
  );
}
