'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';

export default function ManufacturerDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, recalled: 0 });

  useEffect(() => {
    api.getProducts({ limit: 100 }).then((result) => {
      const data = result.data ?? [];
      setProducts(data);
      setStats({
        total: result.total ?? 0,
        active: data.filter((p: any) => p.status === 'ACTIVE').length,
        recalled: data.filter((p: any) => p.status === 'RECALLED').length,
      });
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manufacturer Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 text-center">
          <p className="text-3xl font-bold text-brand-600 dark:text-brand-400">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Products</p>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          <p className="text-sm text-gray-500">Active</p>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-3xl font-bold text-red-600">{stats.recalled}</p>
          <p className="text-sm text-gray-500">Recalled</p>
        </Card>
      </div>
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Your Products</h2>
        {products.length > 0 ? (
          <div className="space-y-3">
            {products.map((product: any) => (
              <a key={product.id} href={`/products/${product.id}`} className="block p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.sku ?? 'No SKU'}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    product.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    product.status === 'RECALLED' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {product.status}
                  </span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No products registered yet.</p>
        )}
      </Card>
    </div>
  );
}
