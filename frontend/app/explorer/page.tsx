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
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Provenance Explorer
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
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
            <div className="flex gap-3 max-w-xl">
              <Input
                placeholder="Search by product ID, name, or manufacturer..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((product: any) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      setActiveTab('graph');
                      loadProvenance(product.id);
                    }}
                    className="text-left bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:border-brand-300 dark:hover:border-brand-700 transition-all hover:shadow-md"
                  >
                    <p className="font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {product.manufacturer?.name} {product.originCountry && `· ${product.originCountry}`}
                    </p>
                    <p className="text-xs text-gray-400 font-mono mt-1">ID: {product.id}</p>
                  </button>
                ))}
              </div>
            ) : query && !isLoading ? (
              <Card className="p-12 text-center text-gray-500 dark:text-gray-400">
                <p className="text-lg mb-2">🔍</p>
                <p>No products found for &ldquo;{query}&rdquo;</p>
              </Card>
            ) : (
              <Card className="p-12 text-center text-gray-500 dark:text-gray-400">
                <p className="text-lg mb-2">🔍</p>
                <p>Enter a search term to explore the provenance graph.</p>
                <p className="text-sm mt-2">Browse products, trace supply chains, and verify certificates.</p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="graph">
          {selectedProductId ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Exploring provenance for product: <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{selectedProductId}</span>
                </p>
                <button
                  onClick={() => {
                    setSelectedProductId(null);
                    setGraphNodes([]);
                    setGraphEdges([]);
                  }}
                  className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Clear
                </button>
              </div>
              {isLoading ? (
                <div className="h-[400px] bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              ) : (
                <ProvenanceGraph nodes={graphNodes} edges={graphEdges} />
              )}
            </div>
          ) : (
            <Card className="p-12 text-center text-gray-500 dark:text-gray-400">
              <p className="text-lg mb-2">🔗</p>
              <p>Search for a product to view its provenance graph.</p>
              <p className="text-sm mt-2">Switch to the Browse tab to find products.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
