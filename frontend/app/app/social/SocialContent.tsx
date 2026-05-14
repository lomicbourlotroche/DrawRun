'use client';

import { useState } from 'react';
import { Users, Flame, Users2, Trophy, TrendingUp } from 'lucide-react';
import FriendsTab from './tabs/FriendsTab';
import FeedTab from './tabs/FeedTab';
import GroupsTab from './tabs/GroupsTab';
import ChallengesTab from './tabs/ChallengesTab';
import LeaderboardTab from './tabs/LeaderboardTab';

export default function SocialContent() {
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'groups' | 'challenges' | 'rankings'>('feed');

  const tabs = [
    { id: 'feed', label: 'Fil', icon: Flame },
    { id: 'friends', label: 'Amis', icon: Users },
    { id: 'groups', label: 'Groupes', icon: Users2 },
    { id: 'challenges', label: 'Défis', icon: Trophy },
    { id: 'rankings', label: 'Classement', icon: TrendingUp },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Social
        </h1>
        <p className="text-muted mt-1">Connectez-vous avec d&apos;autres athlètes</p>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-card border border-border text-muted hover:text-foreground hover:border-primary/30'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'feed' && <FeedTab />}
        {activeTab === 'friends' && <FriendsTab />}
        {activeTab === 'groups' && <GroupsTab />}
        {activeTab === 'challenges' && <ChallengesTab />}
        {activeTab === 'rankings' && <LeaderboardTab />}
      </div>
    </div>
  );
}
