'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CertificateData {
  id: string;
  title: string;
  certType: string;
  status: string;
  issuedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  revocationReason?: string;
  issuerId?: string;
  issuerName?: string;
  productId?: string;
  productName?: string;
  ipfsHash?: string;
  description?: string;
  pdfUrl?: string;
}

interface CertificatePreviewProps {
  certificate: CertificateData;
  showPdf?: boolean;
  onVerify?: (id: string) => Promise<boolean>;
  onRevoke?: (id: string) => void;
}

const STATUS_CONFIG = {
  active: { label: 'Active', variant: 'default' as const },
  revoked: { label: 'Revoked', variant: 'destructive' as const },
  expired: { label: 'Expired', variant: 'secondary' as const },
  pending: { label: 'Pending', variant: 'outline' as const },
};

export function CertificatePreview({
  certificate,
  showPdf = false,
  onVerify,
  onRevoke,
}: CertificatePreviewProps) {
  const [verificationStatus, setVerificationStatus] = useState<
    'idle' | 'verifying' | 'valid' | 'invalid'
  >('idle');
  const [isRevoking, setIsRevoking] = useState(false);

  const statusConfig =
    STATUS_CONFIG[certificate.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
  const isRevoked = certificate.status === 'revoked';

  const handleVerify = async () => {
    if (!onVerify) {
      return;
    }
    setVerificationStatus('verifying');
    try {
      const isValid = await onVerify(certificate.id);
      setVerificationStatus(isValid ? 'valid' : 'invalid');
    } catch {
      setVerificationStatus('invalid');
    }
  };

  const handleRevoke = () => {
    setIsRevoking(true);
    onRevoke?.(certificate.id);
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="bg-brand-100 dark:bg-brand-900 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-2xl">
              🏷️
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {certificate.title}
              </h3>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="outline">{certificate.certType}</Badge>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isRevoked && onVerify && (
              <button
                onClick={handleVerify}
                disabled={verificationStatus === 'verifying'}
                className="bg-brand-500 hover:bg-brand-600 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
              >
                {verificationStatus === 'verifying' ? 'Verifying...' : 'Verify'}
              </button>
            )}
            {!isRevoked && onRevoke && (
              <button
                onClick={handleRevoke}
                disabled={isRevoking}
                className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950"
              >
                {isRevoking ? 'Revoking...' : 'Revoke'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Issued</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {new Date(certificate.issuedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          {certificate.expiresAt && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Expires</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {new Date(certificate.expiresAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}
          {certificate.issuerName && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Issuer</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {certificate.issuerName}
              </p>
            </div>
          )}
          {certificate.productName && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Product</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {certificate.productName}
              </p>
            </div>
          )}
          {certificate.issuerId && (
            <div className="col-span-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Issuer ID</p>
              <p className="break-all font-mono text-xs text-gray-700 dark:text-gray-300">
                {certificate.issuerId}
              </p>
            </div>
          )}
        </div>

        {verificationStatus === 'valid' && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950">
            <p className="text-sm text-green-700 dark:text-green-300">
              ✅ Certificate verified — on-chain record matches the issued data.
            </p>
          </div>
        )}
        {verificationStatus === 'invalid' && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
            <p className="text-sm text-red-700 dark:text-red-300">
              ❌ Certificate verification failed — on-chain record does not match.
            </p>
          </div>
        )}

        {isRevoked && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
            <p className="mb-1 text-sm font-medium text-red-700 dark:text-red-300">
              ⛔ This certificate has been revoked
            </p>
            {certificate.revokedAt && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Revoked on: {new Date(certificate.revokedAt).toLocaleDateString()}
                {certificate.revocationReason && ` — ${certificate.revocationReason}`}
              </p>
            )}
          </div>
        )}

        {certificate.description && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{certificate.description}</p>
        )}

        {certificate.ipfsHash && (
          <div className="mt-4 rounded bg-gray-50 p-2 dark:bg-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">IPFS Hash</p>
            <p className="text-brand-600 dark:text-brand-400 break-all font-mono text-xs">
              {certificate.ipfsHash}
            </p>
          </div>
        )}
      </Card>

      {showPdf && certificate.pdfUrl && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Certificate Document
            </span>
            <a
              href={certificate.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 dark:text-brand-400 text-xs hover:underline"
            >
              Download PDF ↗
            </a>
          </div>
          <iframe
            src={certificate.pdfUrl}
            className="h-96 w-full bg-white"
            title="Certificate PDF"
          />
        </Card>
      )}
    </div>
  );
}
