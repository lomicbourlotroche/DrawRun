'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { NavTabs } from '@/components/ui';
import { ProfileTab } from '@/components/features/profile/ProfileTab';
import { SyncTab } from '@/components/features/profile/SyncTab';

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'profile');

  const tabs = useMemo(() => [
    { id: 'profile', label: 'Profil', icon: null },
    { id: 'sync', label: 'Sync', icon: null },
  ], []);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <NavTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      <div role="tabpanel">
        {activeTab === 'profile' && <ProfileTab isNewUser={searchParams.get('new') === '1'} />}
        {activeTab === 'sync' && <SyncTab />}
      </div>
    </div>
  );
}

export default function ProfileContent() {
  return (
    <Suspense fallback={<div />}>
      <ProfilePageContent />
    </Suspense>
  );
}
