'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui';
import { cn } from '@/lib/utils';
import { User } from '@/components/ui/icons';
import { ProfileTab } from '@/components/features/profile/ProfileTab';
import { SyncTab } from '@/components/features/profile/SyncTab';

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'profile');

  const tabs = useMemo(() => [
    { id: 'profile', label: 'Profil' },
    { id: 'sync', label: 'Sync' },
  ], []);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="animate-slide-up opacity-0 fill-mode-forwards delay-[0ms]">
        <Card variant="glass" accent="primary" className="relative overflow-hidden">
          <CardContent className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0 shadow-sm">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Profil</h1>
              <p className="text-muted mt-1">G&eacute;rez votre compte et vos appareils</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="animate-slide-up opacity-0 fill-mode-forwards delay-[100ms]">
        <div className="flex items-center gap-1 overflow-x-auto" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted hover:text-foreground hover:bg-muted/20'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-slide-up opacity-0 fill-mode-forwards delay-[200ms]" role="tabpanel">
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
