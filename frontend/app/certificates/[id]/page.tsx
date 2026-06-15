'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function CertificateDetailPage() {
  const params = useParams();
  const [certificate, setCertificate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getCertificate(params.id as string).then(setCertificate).catch(() => setCertificate(null)).finally(() => setIsLoading(false));
  }, [params.id]);

  if (isLoading) {
    return <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />;
  }

  if (!certificate) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500">Certificate not found</p>
        <a href="/certificates" className="text-brand-600 hover:underline mt-4 inline-block">← Back to certificates</a>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <a href="/certificates" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">← Back to certificates</a>
      <Card className="p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{certificate.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge>{certificate.certType}</Badge>
              <Badge variant={certificate.status === 'active' ? 'default' : 'secondary'}>{certificate.status}</Badge>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Issued</p>
            <p className="font-medium">{new Date(certificate.issuedAt).toLocaleDateString()}</p>
          </div>
          {certificate.expiresAt && (
            <div>
              <p className="text-gray-500 dark:text-gray-400">Expires</p>
              <p className="font-medium">{new Date(certificate.expiresAt).toLocaleDateString()}</p>
            </div>
          )}
          {certificate.issuerId && (
            <div className="col-span-2">
              <p className="text-gray-500 dark:text-gray-400">Issuer</p>
              <p className="font-medium font-mono text-xs break-all">{certificate.issuerId}</p>
            </div>
          )}
          {certificate.description && (
            <div className="col-span-2">
              <p className="text-gray-500 dark:text-gray-400">Description</p>
              <p className="text-gray-700 dark:text-gray-300">{certificate.description}</p>
            </div>
          )}
        </div>
        {certificate.ipfsHash && (
          <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">IPFS Hash</p>
            <p className="text-xs font-mono text-brand-600 dark:text-brand-400 break-all">{certificate.ipfsHash}</p>
          </div>
        )}
      </Card>
      <div className="text-center">
        <iframe
          src={`/api/certificates/${certificate.id}/pdf`}
          className="w-full h-96 rounded-xl border border-gray-200 dark:border-gray-800"
          title="Certificate PDF"
        />
      </div>
    </div>
  );
}
