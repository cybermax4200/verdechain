'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface Certificate {
  id: string;
  title: string;
  certType: string;
  status: string;
  issuedAt: string;
  productId: string;
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getCertificates({ limit: 50 }).then((result) => {
      setCertificates(result.data ?? []);
    }).catch(() => {
      setCertificates([]);
    }).finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Certificates</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map((cert) => (
            <a key={cert.id} href={`/certificates/${cert.id}`}>
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <Badge>{cert.certType}</Badge>
                  <Badge variant={cert.status === 'active' ? 'default' : 'secondary'}>
                    {cert.status}
                  </Badge>
                </div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{cert.title}</p>
                <p className="text-sm text-gray-500 mt-1">{new Date(cert.issuedAt).toLocaleDateString()}</p>
              </Card>
            </a>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          No certificates found.
        </div>
      )}
    </div>
  );
}
