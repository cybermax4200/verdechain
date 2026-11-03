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
  nodes: {
    id: string;
    label: string;
    role: 'manufacturer' | 'supplier' | 'logistics' | 'verifier' | 'retailer';
  }[];
  edges: {
    source: string;
    target: string;
    label?: string;
    type: 'transfer' | 'lifecycle' | 'certification';
  }[];
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
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventForm, setEventForm] = useState({
    stage: 'MANUFACTURING',
    description: '',
    location: '',
    energyKwh: 0,
    fuelUsed: 0,
    fuelType: 'diesel',
    wasteKg: 0,
  });

  const handleRecordEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) {
      return;
    }
    setIsSubmitting(true);
    try {
      await api.request({
        method: 'POST',
        url: '/supply-chain/events',
        data: {
          ...eventForm,
          productId: product.id,
          timestamp: new Date().toISOString(),
        },
      });
      setIsEventModalOpen(false);
      setEventForm({
        stage: 'MANUFACTURING',
        description: '',
        location: '',
        energyKwh: 0,
        fuelUsed: 0,
        fuelType: 'diesel',
        wasteKg: 0,
      });
      await loadProduct();
    } catch (err) {
      console.error('Failed to record event', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestAttestation = async () => {
    if (!product) {
      return;
    }
    try {
      await api.request({
        method: 'POST',
        url: '/attestations/submit',
        data: { productId: product.id },
      });
      alert('Product submitted for verifier attestation!');
      await loadProduct();
    } catch (err) {
      console.error('Failed to submit attestation', err);
    }
  };

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
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-64 rounded-xl bg-gray-200 lg:col-span-2 dark:bg-gray-800" />
          <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-16 text-center">
        <p className="text-red-500">{error ?? 'Product not found'}</p>
        <a href="/products" className="text-brand-600 mt-4 inline-block hover:underline">
          ← Back to products
        </a>
      </div>
    );
  }

  const latestCarbon = carbon[0];
  const carbonBreakdown = latestCarbon?.breakdown
    ? Object.entries(latestCarbon.breakdown as Record<string, number>).map(([stage, value]) => ({
        stage,
        scope:
          stage === 'rawMaterialExtraction' || stage === 'manufacturing'
            ? ('scope1' as const)
            : stage === 'transportation' || stage === 'distribution'
              ? ('scope3' as const)
              : ('scope2' as const),
        value,
        percentage:
          latestCarbon.totalFootprint > 0 ? (value / latestCarbon.totalFootprint) * 100 : 0,
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
    <div className="animate-fade-in space-y-8">
      <div>
        <a
          href="/products"
          className="text-brand-600 dark:text-brand-400 mb-2 inline-block text-sm hover:underline"
        >
          ← Back to products
        </a>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{product.name}</h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              {product.sku && <span>SKU: {product.sku}</span>}
              {product.batchNumber && <span>Batch: {product.batchNumber}</span>}
              {product.productType && <Badge variant="secondary">{product.productType}</Badge>}
              <Badge variant={product.status === 'ACTIVE' ? 'default' : 'destructive'}>
                {product.status}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEventModalOpen(true)}
              className="bg-brand-500 hover:bg-brand-600 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors"
            >
              + Record Event
            </button>
            <button
              onClick={handleRequestAttestation}
              className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300"
            >
              Request Attestation
            </button>
          </div>
        </div>
      </div>

      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
              Record Lifecycle Event
            </h2>
            <form onSubmit={handleRecordEvent} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Lifecycle Stage *
                </label>
                <select
                  value={eventForm.stage}
                  onChange={(e) => setEventForm({ ...eventForm, stage: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <option value="RAW_MATERIAL_EXTRACTION">Raw Material Extraction</option>
                  <option value="TRANSPORT_TO_SUPPLIER">Transport to Supplier</option>
                  <option value="MANUFACTURING">Manufacturing</option>
                  <option value="TRANSPORT_TO_DISTRIBUTOR">Transport to Distributor</option>
                  <option value="DISTRIBUTION">Distribution</option>
                  <option value="RETAIL">Retail</option>
                  <option value="USE">Use Phase</option>
                  <option value="END_OF_LIFE">End of Life</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Description *
                </label>
                <input
                  type="text"
                  required
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="e.g. Assembled chassis using 100% solar power"
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Location (GPS or Country/City)
                </label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  placeholder="Porto, Portugal"
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Energy (kWh)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={eventForm.energyKwh}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, energyKwh: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Waste (kg)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={eventForm.wasteKg}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, wasteKg: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand-500 hover:bg-brand-600 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Record On-Chain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Product Information</h2>
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
              <p className="font-mono font-medium">#{product.productId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Registered</p>
              <p className="font-medium">{new Date(product.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          {product.description && (
            <p className="mt-4 text-gray-600 dark:text-gray-300">{product.description}</p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Carbon Footprint</h2>
          {latestCarbon ? (
            <div className="space-y-3">
              <div className="text-brand-600 dark:text-brand-400 text-3xl font-bold">
                {(latestCarbon.totalFootprint ?? 0).toFixed(1)}
                <span className="ml-1 text-sm font-normal text-gray-500">kg CO₂e</span>
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
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Confidence: {latestCarbon.confidenceScore ?? 'N/A'}% · {latestCarbon.methodology}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No carbon data available</p>
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
              <p className="mb-2 text-lg">🌱</p>
              <p>No carbon data available for this product.</p>
              <p className="mt-1 text-sm">
                Record lifecycle events to generate a carbon footprint breakdown.
              </p>
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
              <p className="mb-2 text-lg">🏷️</p>
              <p>No certificates issued for this product.</p>
              <p className="mt-1 text-sm">
                Complete the attestation process to issue certificates.
              </p>
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
              <p className="mb-2 text-lg">🔗</p>
              <p>No provenance data available for this product.</p>
              <p className="mt-1 text-sm">
                The provenance graph will show the complete supply chain journey.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <div className="py-4 text-center">
        <p className="font-mono text-xs text-gray-400 dark:text-gray-500">
          Product ID: {product.id} | On-chain verification available
        </p>
      </div>
    </div>
  );
}
