'use client';

import { useState, useEffect } from 'react';
import { Skeleton, GlassCard } from '@/components/ui';
import { Trophy } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { useLeaderboard } from '@/hooks/useSocial';
import { LEADERBOARD_CATEGORIES, LEADERBOARD_PERIODS, PODIUM_STYLES, SOCIAL_ERRORS } from '@/constants/social';
import { toast } from 'sonner';

export default function LeaderboardTab() {
  const {
    entries,
    isLoading,
    error,
    category,
    period,
    setCategory,
    setPeriod,
    loadLeaderboard,
  } = useLeaderboard();

  // Show errors
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Get current category info
  const currentCategory = LEADERBOARD_CATEGORIES.find((c) => c.id === category) || LEADERBOARD_CATEGORIES[0];

  // Get podium style (fallback to default if index > 2)
  const getPodiumStyle = (index: number) => {
    return PODIUM_STYLES[index] || { bg: 'from-muted to-muted/50', text: 'text-muted', badge: `#${index + 1}`, label: '', ring: 'ring-border' };
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-500/20 flex items-center justify-center">
          <Trophy className="w-12 h-12 text-warning/50" />
        </div>
        <p className="font-semibold text-lg">Aucune donnée</p>
        <p className="text-sm text-muted mt-2">Commencez à vous entraîner pour apparaître ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {LEADERBOARD_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              aria-label={`Filtrer par ${c.label}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                category === c.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-card border border-border text-muted hover:border-primary/30'
              }`}
            >
              <c.icon className="w-4 h-4" />
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {LEADERBOARD_PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              aria-label={`Période: ${p.label}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                period === p.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Podium */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 0, 2].map((idx) => {
            const entry = entries[idx];
            const style = getPodiumStyle(idx);
            return (
              <div
                key={idx}
                className={`flex flex-col items-center p-4 rounded-2xl bg-gradient-to-b ${
                  style.bg
                } ${idx === 0 ? 'order-2' : idx === 1 ? 'order-1' : 'order-3'}`}
              >
                <div className={`text-2xl mb-2`}>{style.badge}</div>
                <Avatar name={entry.name} size={idx === 0 ? 'lg' : 'md'} />
                <p className={`font-semibold text-sm mt-2 ${idx === 0 ? 'text-white' : 'text-foreground'}`}>
                  {entry.name}
                </p>
                <p className={`text-lg font-bold ${idx === 0 ? 'text-white' : 'text-primary'}`}>
                  {entry.value}
                </p>
                <p className={`text-xs ${idx === 0 ? 'text-white/80' : 'text-muted'}`}>
                  {currentCategory.unit}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Rest of the list */}
      {entries.slice(3).map((entry, index) => {
        const actualIndex = index + 3;
        const style = getPodiumStyle(actualIndex);
        return (
          <GlassCard key={actualIndex} padding="sm" hover>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${style.bg} flex items-center justify-center font-bold text-sm text-white`}
                >
                  {actualIndex + 1}
                </div>
                <Avatar name={entry.name} size="md" />
                <div>
                  <p className="font-semibold">{entry.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">{entry.value}</p>
                <p className="text-xs text-muted">{currentCategory.unit}</p>
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
