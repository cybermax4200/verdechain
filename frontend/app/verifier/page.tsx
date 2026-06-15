'use client';

import { Card } from '@/components/ui/card';

export default function VerifierDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Verifier Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 text-center">
          <p className="text-3xl font-bold text-brand-600 dark:text-brand-400">0</p>
          <p className="text-sm text-gray-500">Pending Attestations</p>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-3xl font-bold text-green-600">85</p>
          <p className="text-sm text-gray-500">Reputation Score</p>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">10,000</p>
          <p className="text-sm text-gray-500">Stake (XLM)</p>
        </Card>
      </div>
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Pending Attestations</h2>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-2">📋</p>
          <p>No pending attestations at this time.</p>
          <p className="text-sm mt-1">Connect your verifier account to see attestations requiring review.</p>
        </div>
      </Card>
    </div>
  );
}
