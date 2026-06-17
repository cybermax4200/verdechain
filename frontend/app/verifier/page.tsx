'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

interface Attestation {
  id: string;
  productId: string;
  productName: string;
  manufacturer: string;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  submittedAt: string;
  verifierCount: number;
  requiredCount: number;
}

export default function VerifierDashboard() {
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    loadAttestations();
    if (typeof window !== 'undefined' && window.freighter) {
      window.freighter.getPublicKey().then(setWalletAddress).catch(() => {});
    }
  }, []);

  const loadAttestations = async () => {
    setIsLoading(true);
    try {
      const data = await api.request<Attestation[]>({ method: 'GET', url: '/verifiers/pending' });
      setAttestations(data);
    } catch {
      setAttestations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await api.request({
        method: 'POST',
        url: `/attestations/${id}/${action}`,
      });
      setAttestations((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error(`Failed to ${action} attestation:`, error);
    }
  };

  const handleEscalate = async (id: string) => {
    try {
      await api.request({
        method: 'POST',
        url: `/attestations/${id}/escalate`,
      });
      setAttestations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'escalated' as const } : a)),
      );
    } catch (error) {
      console.error('Failed to escalate attestation:', error);
    }
  };

  const pendingAttestations = attestations.filter((a) => a.status === 'pending');
  const resolvedAttestations = attestations.filter((a) => a.status !== 'pending');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Verifier Dashboard
          </h1>
          {walletAddress && (
            <p className="text-xs text-gray-500 font-mono mt-1">
              Connected: {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
            </p>
          )}
        </div>
        <button
          onClick={loadAttestations}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-orange-500">
            {isLoading ? '...' : pendingAttestations.length}
          </p>
          <p className="text-sm text-gray-500">Pending Review</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-brand-600 dark:text-brand-400">85</p>
          <p className="text-sm text-gray-500">Reputation Score</p>
          <div className="mt-2 w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full" style={{ width: '85%' }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">Top 15% of verifiers</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">10,000</p>
          <p className="text-sm text-gray-500">Stake (XLM)</p>
          <p className="text-xs text-gray-400 mt-1">Lock period: 30 days</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Pending Attestations
          {pendingAttestations.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({pendingAttestations.length} awaiting your review)
            </span>
          )}
        </h2>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : pendingAttestations.length > 0 ? (
          <div className="space-y-3">
            {pendingAttestations.map((att) => (
              <div key={att.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {att.productName}
                      </p>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Manufacturer: {att.manufacturer} · Submitted {new Date(att.submittedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {att.verifierCount}/{att.requiredCount} verifiers assigned
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction(att.id, 'approve')}
                    className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => handleAction(att.id, 'reject')}
                    className="px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                  >
                    ❌ Reject
                  </button>
                  <button
                    onClick={() => handleEscalate(att.id)}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ml-auto"
                  >
                    Escalate
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">✅</p>
            <p>No pending attestations at this time.</p>
            <p className="text-sm mt-1">
              All attestations have been reviewed. Check back later for new submissions.
            </p>
          </div>
        )}
      </Card>

      {resolvedAttestations.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-2">
            {resolvedAttestations.slice(0, 5).map((att) => (
              <div key={att.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {att.productName}
                  </p>
                  <p className="text-xs text-gray-500">{att.manufacturer}</p>
                </div>
                <Badge
                  variant={att.status === 'approved' ? 'default' : att.status === 'rejected' ? 'destructive' : 'secondary'}
                >
                  {att.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Stake Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Current Stake</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">10,000 XLM</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Minimum Required</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">1,000 XLM</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Lock Period</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">30 days</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors">
            Add Stake
          </button>
          <button className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
            Request Withdrawal
          </button>
        </div>
      </Card>
    </div>
  );
}
