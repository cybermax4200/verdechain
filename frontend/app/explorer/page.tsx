'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ProvenanceGraph } from '@/components/provenance-graph';
import { api } from '@/lib/api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface GraphNode {
  id: string;
  label: string;
  role: 'manufacturer' | 'supplier' | 'logistics' | 'verifier' | 'retailer';
  productCount?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  label?: string;
  type: 'transfer' | 'lifecycle' | 'certification';
  timestamp?: string;
}

export default function ExplorerPage() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const result = await api.getProducts({ q: query, limit: 20 });
      setSearchResults(result.data ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const loadProvenance = useCallback(async (productId: string) => {
    setIsLoading(true);
    setSelectedProductId(productId);
    try {
      const data = await api.getProvenance(productId);
      setGraphNodes(data.nodes as GraphNode[]);
      setGraphEdges(data.edges as GraphEdge[]);
    } catch {
      setGraphNodes([]);
      setGraphEdges([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="py-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
          Provenance Explorer
        </h1>
        <p className="mx-auto max-w-xl text-gray-500 dark:text-gray-400">
          Explore the public ledger of product provenance, certifications, and carbon data.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="browse">Browse Products</TabsTrigger>
          <TabsTrigger value="graph">Provenance Graph</TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <div className="space-y-4">
            <div className="flex max-w-xl gap-3">
              <Input
                placeholder="Search by product ID, name, or manufacturer..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="bg-brand-500 hover:bg-brand-600 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((product: any) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      setActiveTab('graph');
                      loadProvenance(product.id);
                    }}
                    className="hover:border-brand-300 dark:hover:border-brand-700 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                  >
                    <p className="font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {product.manufacturer?.name}{' '}
                      {product.originCountry && `· ${product.originCountry}`}
                    </p>
                    <p className="mt-1 font-mono text-xs text-gray-400">ID: {product.id}</p>
                  </button>
                ))}
              </div>
            ) : query && !isLoading ? (
              <Card className="p-12 text-center text-gray-500 dark:text-gray-400">
                <p className="mb-2 text-lg">🔍</p>
                <p>No products found for &ldquo;{query}&rdquo;</p>
              </Card>
            ) : (
              <Card className="p-12 text-center text-gray-500 dark:text-gray-400">
                <p className="mb-2 text-lg">🔍</p>
                <p>Enter a search term to explore the provenance graph.</p>
                <p className="mt-2 text-sm">
                  Browse products, trace supply chains, and verify certificates.
                </p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="graph">
          {selectedProductId ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Exploring provenance for product:{' '}
                  <span className="font-mono font-medium text-gray-700 dark:text-gray-300">
                    {selectedProductId}
                  </span>
                </p>
                <button
                  onClick={() => {
                    setSelectedProductId(null);
                    setGraphNodes([]);
                    setGraphEdges([]);
                  }}
                  className="text-brand-600 dark:text-brand-400 text-sm hover:underline"
                >
                  Clear
                </button>
              </div>
              {isLoading ? (
                <div className="h-[400px] animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
              ) : (
                <ProvenanceGraph nodes={graphNodes} edges={graphEdges} />
              )}
            </div>
          ) : (
            <Card className="p-12 text-center text-gray-500 dark:text-gray-400">
              <p className="mb-2 text-lg">🔗</p>
              <p>Search for a product to view its provenance graph.</p>
              <p className="mt-2 text-sm">Switch to the Browse tab to find products.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
