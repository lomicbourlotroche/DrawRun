'use client';

import React, { useState, useMemo } from 'react';
import { Users, Flame, Users2, Trophy, TrendingUp } from 'lucide-react';
import { NavTabs } from '@/components/ui';
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
    { id: 'challenges', label: 'Défis', icon: <Trophy className="w-4 h-4" /> },
    { id: 'rankings', label: 'Classement', icon: <TrendingUp className="w-4 h-4" /> },
  ] as const, []);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
          <Users className="w-6 h-6 text-primary-500" />
          Social
        </h1>
        <p className="text-neutral-500 mt-1.5">Connectez-vous avec d&apos;autres athlètes</p>
      </div>

      <NavTabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as typeof tabs[number]['id'])} />

      <div role="tabpanel" aria-label={`Contenu de l'onglet ${tabs.find(t => t.id === activeTab)?.label}`}>
        {activeTab === 'feed' && <FeedTab />}
        {activeTab === 'friends' && <FriendsTab />}
        {activeTab === 'groups' && <GroupsTab />}
        {activeTab === 'challenges' && <ChallengesTab />}
        {activeTab === 'rankings' && <LeaderboardTab />}
      </div>
    </div>
  );
}

