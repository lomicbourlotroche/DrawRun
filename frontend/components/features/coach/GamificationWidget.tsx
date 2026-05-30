'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { api } from '@/lib/api';
import { Trophy, Flame, Star, Target, Medal, Crown, Zap, Activity } from 'lucide-react';
import type { IconType } from 'react-icons';

/**
 * Badge information for gamification
 */
interface GamificationBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
}

/**
 * Streak information
 */
interface GamificationStreak {
  current: number;
  longest: number;
  lastActiveDate: string;
}

/**
 * Achievement information
 */
interface GamificationAchievement {
  id: string;
  name: string;
  progress: number;
  target: number;
  unlocked: boolean;
}

/**
 * Level information
 */
interface GamificationLevel {
  current: number;
  xp: number;
  xpToNext: number;
  title: string;
}

/**
 * Stats information
 */
interface GamificationStats {
  totalKm: number;
  totalHours: number;
  totalSessions: number;
}

/**
 * Complete gamification data
 */
interface GamificationData {
  planId: number;
  badges: GamificationBadge[];
  streaks: GamificationStreak;
  achievements: GamificationAchievement[];
  level: GamificationLevel;
  stats: GamificationStats;
}

interface GamificationWidgetProps {
  planId: number;
}

/**
 * Map of icon names to Lucide icon components
 */
const iconMap: Record<string, IconType> = {
  trophy: Trophy,
  flame: Flame,
  star: Star,
  target: Target,
  medal: Medal,
  crown: Crown,
  zap: Zap,
  activity: Activity,
};

/**
 * GamificationWidget component for displaying user achievements, badges, and progress.
 * 
 * Features:
 * - Level and XP progress display
 * - Statistics (total km, hours, sessions)
 * - Current and longest streaks
 * - Earned badges display
 * - Achievements progress tracking
 * 
 * @param planId - The ID of the training plan to display gamification data for
 */
export default function GamificationWidget({ planId }: GamificationWidgetProps) {
  const [data, setData] = useState<GamificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load gamification data from the API
   */
  const loadGamification = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.getGamification(planId);
      setData(result);
    } catch {
      /* silencieux — data reste null, composant retourne null */
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    loadGamification();
  }, [loadGamification]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const xpPercent = (data.level.xp / data.level.xpToNext) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning/80" />
          Gamification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-warning/80" />
              <div>
                <p className="font-bold text-foreground">{data.level.title}</p>
                <p className="text-xs text-muted">Niveau {data.level.current}</p>
              </div>
            </div>
            <Badge className="bg-primary/20 text-primary">
              {data.level.xp} / {data.level.xpToNext} XP
            </Badge>
          </div>
          <div className="h-2 bg-background rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-success/10 border border-success/20">
            <p className="text-xl font-bold text-success/80">{data.stats.totalKm}</p>
            <p className="text-xs text-muted">km</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xl font-bold text-primary/80">{Math.round(data.stats.totalHours)}h</p>
            <p className="text-xs text-muted">entraînement</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-peak/10 border border-peak/20">
            <p className="text-xl font-bold text-peak/80">{data.stats.totalSessions}</p>
            <p className="text-xs text-muted">séances</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Séries</p>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 p-3 rounded-lg bg-danger/10 border border-danger/20">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-danger/80" />
                <div>
                  <p className="text-lg font-bold text-danger/80">{data.streaks.current}</p>
                  <p className="text-xs text-muted">Actuelle</p>
                </div>
              </div>
            </div>
            <div className="flex-1 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <div className="flex items-center gap-2">
                <Medal className="w-5 h-5 text-warning/80" />
                <div>
                  <p className="text-lg font-bold text-warning/80">{data.streaks.longest}</p>
                  <p className="text-xs text-muted">Record</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {data.badges.filter(b => b.earnedAt).length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Badges obtenus</p>
            <div className="flex flex-wrap gap-2">
              {data.badges.filter(b => b.earnedAt).map(badge => {
                const Icon = iconMap[badge.icon] || Star;
                return (
                  <div
                    key={badge.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-warning-500/20 to-peak-500/20 border border-warning/30"
                    title={badge.description}
                  >
                    <Icon className="w-4 h-4 text-warning/80" />
                    <span className="text-xs font-medium text-foreground">{badge.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {data.achievements.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Objectifs</p>
            {data.achievements.map(ach => (
              <div key={ach.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={ach.unlocked ? 'text-primary' : 'text-muted'}>{ach.name}</span>
                  <span className="text-foreground">{ach.progress}/{ach.target}</span>
                </div>
                <div className="h-1.5 bg-background rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${ach.unlocked ? 'bg-success' : 'bg-primary/60'}`}
                    style={{ width: `${(ach.progress / ach.target) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
