'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api, CarbonFootprint, LifecycleEvent } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ProvenanceGraph } from '@/components/provenance-graph';
import { LifecycleTimeline } from '@/components/lifecycle-timeline';
import { CarbonBreakdown } from '@/components/carbon-breakdown';
import { CertificatePreview } from '@/components/certificate-preview';

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

interface ProvenanceData {
  nodes: { id: string; label: string; role: 'manufacturer' | 'supplier' | 'logistics' | 'verifier' | 'retailer' }[];
  edges: { source: string; target: string; label?: string; type: 'transfer' | 'lifecycle' | 'certification' }[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [lifecycle, setLifecycle] = useState<LifecycleEvent[]>([]);
  const [carbon, setCarbon] = useState<CarbonFootprint[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [provenance, setProvenance] = useState<ProvenanceData | null>(null);
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
      const [productData, lifecycleData, carbonData, certData, provenanceData] = await Promise.all([
        api.getProduct(id),
        api.getLifecycle(id).catch(() => [] as LifecycleEvent[]),
        api.getCarbonFootprint(id).catch(() => [] as CarbonFootprint[]),
        api.getCertificatesByProduct(id).catch(() => []),
        api.getProvenance(id).catch(() => ({ nodes: [], edges: [] })),
      ]);
      setProduct(productData);
      setLifecycle(lifecycleData);
      setCarbon(carbonData);
      setCertificates(certData);
      setProvenance(provenanceData);
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
  const carbonBreakdown = latestCarbon?.breakdown
    ? Object.entries(latestCarbon.breakdown as Record<string, number>).map(([stage, value]) => ({
        stage,
        scope: stage === 'rawMaterialExtraction' || stage === 'manufacturing' ? 'scope1' as const
          : stage === 'transportation' || stage === 'distribution' ? 'scope3' as const
          : 'scope2' as const,
        value,
        percentage: latestCarbon.totalFootprint > 0 ? (value / latestCarbon.totalFootprint) * 100 : 0,
      }))
    : [];

  const lifecycleEvents: any[] = lifecycle.map((event) => ({
    id: event.id,
    stage: event.stage ?? 'unknown',
    description: event.description,
    location: event.location,
    timestamp: event.timestamp ?? new Date().toISOString(),
    energyKwh: event.energyKwh,
    fuelUsed: event.fuelUsed,
    wasteKg: event.wasteKg,
  }));

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
          <h2 className="text-lg font-semibold mb-4">Product Information</h2>
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

      <Tabs defaultValue="lifecycle">
        <TabsList>
          <TabsTrigger value="lifecycle">Lifecycle Timeline ({lifecycle.length})</TabsTrigger>
          <TabsTrigger value="carbon">Carbon Breakdown</TabsTrigger>
          <TabsTrigger value="certificates">Certificates ({certificates.length})</TabsTrigger>
          <TabsTrigger value="provenance">Provenance Graph</TabsTrigger>
        </TabsList>

        <TabsContent value="lifecycle" className="mt-4">
          <LifecycleTimeline events={lifecycleEvents} />
        </TabsContent>

        <TabsContent value="carbon" className="mt-4">
          {latestCarbon ? (
            <CarbonBreakdown
              breakdown={carbonBreakdown}
              totalFootprint={latestCarbon.totalFootprint}
              scope1={latestCarbon.scope1}
              scope2={latestCarbon.scope2}
              scope3={latestCarbon.scope3}
              confidenceScore={latestCarbon.confidenceScore}
              methodology={latestCarbon.methodology}
            />
          ) : (
            <Card className="p-12 text-center text-gray-500 dark:text-gray-400">
              <p className="text-lg mb-2">🌱</p>
              <p>No carbon data available for this product.</p>
              <p className="text-sm mt-1">Record lifecycle events to generate a carbon footprint breakdown.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="certificates" className="mt-4">
          {certificates.length > 0 ? (
            <div className="space-y-4">
              {certificates.map((cert: any) => (
                <a key={cert.id} href={`/certificates/${cert.id}`} className="block">
                  <CertificatePreview
                    certificate={{
                      id: cert.id,
                      title: cert.title,
                      certType: cert.certType,
                      status: cert.status,
                      issuedAt: cert.issuedAt,
                      expiresAt: cert.expiresAt,
                      issuerName: cert.issuerName,
                      ipfsHash: cert.ipfsHash,
                      description: cert.description,
                    }}
                  />
                </a>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center text-gray-500 dark:text-gray-400">
              <p className="text-lg mb-2">🏷️</p>
              <p>No certificates issued for this product.</p>
              <p className="text-sm mt-1">Complete the attestation process to issue certificates.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="provenance" className="mt-4">
          {provenance && provenance.nodes.length > 0 ? (
            <ProvenanceGraph
              nodes={provenance.nodes}
              edges={provenance.edges}
              onNodeClick={(node) => console.log('Node clicked:', node)}
            />
          ) : (
            <Card className="p-12 text-center text-gray-500 dark:text-gray-400">
              <p className="text-lg mb-2">🔗</p>
              <p>No provenance data available for this product.</p>
              <p className="text-sm mt-1">The provenance graph will show the complete supply chain journey.</p>
            </Card>
          )}
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
