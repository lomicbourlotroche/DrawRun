/**
 * Profile Page avec Lazy Loading
 */

'use client';

import dynamic from 'next/dynamic';
import { ProfileSkeleton } from '@/components/ui';

const ProfileContent = dynamic(() => import('./ProfileContent'), {
  loading: () => <ProfileSkeleton />,
  ssr: false,
});

export default function ProfilePage() {
  return <ProfileContent />;
}
