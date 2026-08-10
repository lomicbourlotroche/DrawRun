'use client';

import React, { useState, useMemo } from 'react';
import { Users, Flame, Users2, Trophy, TrendingUp } from '@/components/ui/icons';
import { Card, CardContent } from '@/components/ui';
import { cn } from '@/lib/utils';
import FriendsTab from './tabs/FriendsTab';
import FeedTab from './tabs/FeedTab';
import GroupsTab from './tabs/GroupsTab';
import ChallengesTab from './tabs/ChallengesTab';
import LeaderboardTab from './tabs/LeaderboardTab';

export default function SocialContent() {
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'groups' | 'challenges' | 'rankings'>('feed');

  const tabs = useMemo(() => [
    { id: 'feed', label: 'Fil', icon: <Flame className="w-4 h-4" /> },
    { id: 'friends', label: 'Amis', icon: <Users className="w-4 h-4" /> },
    { id: 'groups', label: 'Groupes', icon: <Users2 className="w-4 h-4" /> },
    { id: 'challenges', label: 'D\u00e9fis', icon: <Trophy className="w-4 h-4" /> },
    { id: 'rankings', label: 'Classement', icon: <TrendingUp className="w-4 h-4" /> },
  ] as const, []);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="animate-slide-up opacity-0 fill-mode-forwards delay-[0ms]">
        <Card variant="glass" accent="primary" className="relative overflow-hidden">
          <CardContent className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Social</h1>
              <p className="text-muted mt-1">Connectez-vous avec d&apos;autres athlètes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="animate-slide-up opacity-0 fill-mode-forwards delay-[100ms]">
        <div className="flex items-center gap-1.5 overflow-x-auto" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id as typeof tabs[number]['id'])}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'text-muted hover:text-foreground hover:bg-muted/20'
              )}
            >
              <span className="w-4 h-4">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-slide-up opacity-0 fill-mode-forwards delay-[200ms]" role="tabpanel" aria-label={`Contenu de l'onglet ${tabs.find(t => t.id === activeTab)?.label}`}>
        {activeTab === 'feed' && <FeedTab />}
        {activeTab === 'friends' && <FriendsTab />}
        {activeTab === 'groups' && <GroupsTab />}
        {activeTab === 'challenges' && <ChallengesTab />}
        {activeTab === 'rankings' && <LeaderboardTab />}
      </div>
    </div>
  );
}
