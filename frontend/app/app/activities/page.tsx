/**
 * Activities Page avec Lazy Loading
 */

'use client';

import dynamic from 'next/dynamic';
import { ActivitiesSkeleton } from '@/components/ui';

const ActivitiesContent = dynamic(() => import('./ActivitiesContent'), {
  loading: () => <ActivitiesSkeleton />,
  ssr: false,
});

export default function ActivitiesPage() {
  return <ActivitiesContent />;
}
