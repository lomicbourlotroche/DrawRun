/**
 * Performance Page avec Lazy Loading
 */

'use client';

import dynamic from 'next/dynamic';
import { PerformanceSkeleton } from '@/components/ui';

const PerformanceContent = dynamic(() => import('./PerformanceContent'), {
  loading: () => <PerformanceSkeleton />,
  ssr: false,
});

export default function PerformancePage() {
  return <PerformanceContent />;
}
