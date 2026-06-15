'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function ExplorerPage() {
  const [query, setQuery] = useState('');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Provenance Explorer</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Explore the public ledger of product provenance, certifications, and carbon data.
        </p>
      </div>
      <div className="max-w-xl mx-auto">
        <Input
          placeholder="Search by product ID, manufacturer, or certificate..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <Card className="p-12 text-center text-gray-500 dark:text-gray-400">
        <p className="text-lg mb-2">🔍</p>
        <p>Enter a search term to explore the provenance graph.</p>
        <p className="text-sm mt-2">Browse products, trace supply chains, and verify certificates.</p>
      </Card>
    </div>
  );
}
