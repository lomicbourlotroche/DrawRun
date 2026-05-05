/**
 * Social Page avec Lazy Loading
 */

'use client';

import dynamic from 'next/dynamic';
import { SocialSkeleton } from '@/components/ui';

const SocialContent = dynamic(() => import('./SocialContent'), {
  loading: () => <SocialSkeleton />,
  ssr: false,
});

export default function SocialPage() {
  return <SocialContent />;
}
