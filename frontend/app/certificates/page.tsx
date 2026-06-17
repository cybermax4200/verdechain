'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Certificate {
  id: string;
  title: string;
  certType: string;
  status: string;
  issuedAt: string;
  issuerName?: string;
  productName?: string;
}

const CERT_TYPES = ['', 'carbon_neutral', 'certificate_of_origin', 'organic', 'green_tag', 'fair_trade'];
const STATUS_FILTERS = ['', 'active', 'revoked', 'expired'];

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadCertificates();
  }, [typeFilter, statusFilter]);

  const loadCertificates = async () => {
    setIsLoading(true);
    try {
      const result = await api.getCertificates({
        ...(typeFilter && { type: typeFilter }),
        ...(statusFilter && { status: statusFilter }),
        limit: 50,
      });
      setCertificates(result.data ?? []);
    } catch {
      setCertificates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = certificates.filter((cert) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      cert.title.toLowerCase().includes(q) ||
      cert.certType.toLowerCase().includes(q) ||
      cert.id.toLowerCase().includes(q) ||
      cert.issuerName?.toLowerCase().includes(q) ||
      cert.productName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Certificates
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Browse and verify product certificates
          </p>
        </div>
        <button
          onClick={loadCertificates}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : '🔄 Refresh'}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search certificates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm"
        >
          {CERT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type ? type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'All Types'}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Statuses'}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cert) => (
            <a key={cert.id} href={`/certificates/${cert.id}`}>
              <Card className="p-4 hover:shadow-md transition-shadow h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-lg">
                    🏷️
                  </div>
                  <Badge variant={cert.status === 'active' ? 'default' : 'secondary'}>
                    {cert.status}
                  </Badge>
                </div>
                <p className="font-medium text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                  {cert.title}
                </p>
                <Badge variant="outline" className="mb-2">
                  {cert.certType?.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </Badge>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                  <p>Issued: {new Date(cert.issuedAt).toLocaleDateString()}</p>
                  {cert.issuerName && <p>By: {cert.issuerName}</p>}
                  {cert.productName && <p>Product: {cert.productName}</p>}
                </div>
              </Card>
            </a>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-2">🏷️</p>
          <p>{searchQuery ? 'No certificates match your search.' : 'No certificates found.'}</p>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-sm text-brand-600 dark:text-brand-400 hover:underline mt-2">
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  );
}
