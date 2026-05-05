/**
 * Coach Page avec Lazy Loading
 */

'use client';

import dynamic from 'next/dynamic';
import { CoachSkeleton } from '@/components/ui';

const CoachContent = dynamic(() => import('./CoachContent'), {
  loading: () => <CoachSkeleton />,
  ssr: false,
});

export default function CoachPage() {
  return <CoachContent />;
}
