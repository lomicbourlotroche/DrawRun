'use client';

import React, { useState, useCallback } from 'react';
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

  // Keyboard navigation for tabs
  const handleTabKeyDown = useCallback((e: React.KeyboardEvent, tabId: typeof tabs[number]["id"]) => {
    if (e.key === 'ArrowRight') {
      const currentIndex = tabs.findIndex(t => t.id === tabId);
      const nextIndex = (currentIndex + 1) % tabs.length;
      setActiveTab(tabs[nextIndex].id);
    } else if (e.key === 'ArrowLeft') {
      const currentIndex = tabs.findIndex(t => t.id === tabId);
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      setActiveTab(tabs[prevIndex].id);
    } else if (e.key === 'Enter' || e.key === ' ') {
      setActiveTab(tabId);
    }
  }, [tabs]);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
          <Users className="w-6 h-6 text-primary-500" />
          Social
        </h1>
        <p className="text-neutral-500 mt-1.5">Connectez-vous avec d&apos;autres athlètes</p>
      </div>

      <nav className="flex gap-1 overflow-x-auto pb-2 border-b border-neutral-200/60" role="tablist" aria-label="Onglets sociaux">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-label={`Aller à l'onglet ${tab.label}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ease-smooth ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-neutral-600 hover:text-foreground hover:bg-neutral-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </nav>

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

