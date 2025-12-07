'use client';

import { useParams } from 'next/navigation';
import { TrackingAIDashboard } from '@/components/tracking-ai/tracking-ai-dashboard';

export default function TrackingAIPage() {
  const params = useParams();
  const orgId = params.orgId as string;

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <TrackingAIDashboard orgId={orgId} />
    </div>
  );
}
