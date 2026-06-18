'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CertificatePreview } from '@/components/certificate-preview';

export default function CertificateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [certificate, setCertificate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getCertificate(params.id as string)
      .then(setCertificate)
      .catch(() => setCertificate(null))
      .finally(() => setIsLoading(false));
  }, [params.id]);

  const handleVerify = async (id: string): Promise<boolean> => {
    try {
      const result = await api.request<any>({
        method: 'POST',
        url: `/certificates/verify`,
        data: { id },
      });
      return result.valid === true;
    } catch {
      return false;
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await api.request({ method: 'POST', url: `/certificates/${id}/revoke` });
      const updated = await api.getCertificate(id);
      setCertificate(updated);
    } catch (error) {
      console.error('Failed to revoke certificate:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse space-y-4">
        <div className="h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-800" />
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="py-16 text-center">
        <p className="mb-2 text-lg text-red-500">Certificate not found</p>
        <p className="mb-4 text-sm text-gray-500">
          The certificate you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <button
          onClick={() => router.push('/certificates')}
          className="text-brand-600 dark:text-brand-400 hover:underline"
        >
          ← Back to certificates
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-6">
      <button
        onClick={() => router.push('/certificates')}
        className="text-brand-600 dark:text-brand-400 text-sm hover:underline"
      >
        ← Back to certificates
      </button>
      <CertificatePreview
        certificate={{
          ...certificate,
          pdfUrl: certificate.pdfUrl ?? `/api/certificates/${certificate.id}/pdf`,
        }}
        showPdf={true}
        onVerify={handleVerify}
        onRevoke={handleRevoke}
      />
      <div className="text-center">
        <p className="font-mono text-xs text-gray-400 dark:text-gray-500">
          Certificate ID: {certificate.id} | Verify on Stellar blockchain
        </p>
      </div>
    </div>
  );
}
