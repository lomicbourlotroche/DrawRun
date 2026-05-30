
'use client';

import { useState } from 'react';
import { Button, Avatar } from '@/components/ui';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Heart, Users, MessageCircle, Share2, Trophy,
  Flame, TrendingUp, Award, Star
} from 'lucide-react';

interface Draw {
  id: number;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  created_at: string;
}

interface ActivityDrawsProps {
  activityId: number;
  draws: Draw[];
  drawCount: number;
  userHasDrawn: boolean;
  onDrawUpdate?: (_newDraws: Draw[], _newCount: number, _userHasDrawn: boolean) => void;
}

export function ActivityDraws({ 
  activityId, 
  draws, 
  drawCount, 
  userHasDrawn,
  onDrawUpdate 
}: ActivityDrawsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDrawers, setShowDrawers] = useState(false);

  const handleDraw = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      if (userHasDrawn) {
        // Retirer le draw
        const response = await api.toggleActivityDraw(activityId, 0); // 0 pour retirer
        if (response.success) {
          const newDraws = (draws ?? []).filter(d => d.user_id !== 0); // Filtrer le draw de l'utilisateur actuel
          const newCount = response.draw_count;
          onDrawUpdate?.(newDraws, newCount, false);
          toast.success('Draw retiré');
        }
      } else {
        // Ajouter un draw
        const response = await api.toggleActivityDraw(activityId, 1); // 1 pour ajouter
        if (response.success) {
          const newCount = response.draw_count;
          onDrawUpdate?.(draws, newCount, true);
          toast.success('Draw ajouté !');
        }
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du draw');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDrawIcon = () => {
    if (drawCount === 0) return <Heart className="w-4 h-4" />;
    if (drawCount >= 50) return <Flame className="w-4 h-4 text-peak" />;
    if (drawCount >= 20) return <Trophy className="w-4 h-4 text-warning" />;
    if (drawCount >= 10) return <Star className="w-4 h-4 text-primary" />;
    return <Heart className="w-4 h-4 text-danger" />;
  };

  const getDrawColor = () => {
    if (userHasDrawn) return 'primary';
    if (drawCount === 0) return 'secondary';
    if (drawCount >= 50) return 'success';
    if (drawCount >= 20) return 'success';
    return 'default';
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={getDrawColor()}
        size="sm"
        onClick={handleDraw}
        disabled={isSubmitting}
        className="flex items-center gap-2"
      >
        {getDrawIcon()}
        <span>{drawCount}</span>
        <span className="hidden sm:inline">Draw{drawCount !== 1 ? 's' : ''}</span>
      </Button>

      {drawCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDrawers(!showDrawers)}
          className="flex items-center gap-1"
        >
          <Users className="w-4 h-4" />
          <span className="text-xs text-muted">Voir</span>
        </Button>
      )}

      {/* Drawers List */}
      {showDrawers && (draws ?? []).length > 0 && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-danger" />
              {drawCount} Draw{drawCount !== 1 ? 's' : ''}
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {draws.map((draw) => (
                <div key={draw.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <Avatar size="sm" src={draw.user_avatar} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{draw.user_name}</p>
                    <p className="text-xs text-muted">
                      {new Date(draw.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Heart className="w-3 h-3 text-danger" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Component pour les draws dans le feed social
interface SocialDrawProps {
  itemId: number;
  itemType: 'activity' | 'post' | 'comment';
  initialDraws: Draw[];
  initialCount: number;
  userHasDrawn: boolean;
  compact?: boolean;
}

export function SocialDraw({ 
  itemId, 
  initialDraws, 
  initialCount, 
  userHasDrawn,
  compact = false 
}: SocialDrawProps) {
  const [draws, setDraws] = useState<Draw[]>(initialDraws);
  const [drawCount, setDrawCount] = useState(initialCount);
  const [hasDrawn, setHasDrawn] = useState(userHasDrawn);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDraw = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      if (hasDrawn) {
        const response = await api.toggleActivityDraw(itemId, 0); // 0 pour retirer
        if (response.success) {
          setDraws((draws ?? []).filter(d => d.user_id !== 0)); // Filtrer le draw de l'utilisateur actuel
          setDrawCount(response.draw_count);
          setHasDrawn(false);
        }
      } else {
        const response = await api.toggleActivityDraw(itemId, 1); // 1 pour ajouter
        if (response.success) {
          setDrawCount(response.draw_count);
          setHasDrawn(true);
        }
      }
    } catch {
      /* silencieux — draw toggle */
    } finally {
      setIsSubmitting(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleDraw}
        disabled={isSubmitting}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors ${
          hasDrawn 
            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
            : 'text-muted hover:bg-muted hover:text-foreground'
        }`}
      >
        <Heart className={`w-4 h-4 ${hasDrawn ? 'fill-current' : ''}`} />
        <span>{drawCount}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleDraw}
        disabled={isSubmitting}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          hasDrawn 
            ? 'bg-danger text-foreground hover:bg-danger' 
            : 'bg-muted text-muted hover:bg-muted/80 hover:text-foreground'
        }`}
      >
        <Heart className={`w-4 h-4 ${hasDrawn ? 'fill-current' : ''}`} />
        <span>{drawCount} Draw{drawCount !== 1 ? 's' : ''}</span>
      </button>

      <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted hover:bg-muted hover:text-foreground">
        <MessageCircle className="w-4 h-4" />
        <span>Commenter</span>
      </button>

      <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted hover:bg-muted hover:text-foreground">
        <Share2 className="w-4 h-4" />
        <span>Partager</span>
      </button>
    </div>
  );
}

// Component pour les statistiques de draws
interface DrawStatsProps {
  totalDraws: number;
  thisWeek: number;
  thisMonth: number;
  bestActivity?: {
    id: number;
    name: string;
    drawCount: number;
  };
}

export function DrawStats({ totalDraws, thisWeek, thisMonth, bestActivity }: DrawStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg border border-red-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <Heart className="w-6 h-6 text-danger" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{totalDraws}</p>
            <p className="text-sm text-muted">Draws totaux</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{thisWeek}</p>
            <p className="text-sm text-muted">Cette semaine</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <Award className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{thisMonth}</p>
            <p className="text-sm text-muted">Ce mois</p>
          </div>
        </div>
      </div>

      {bestActivity && (
        <div className="md:col-span-3 p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-warning" />
            <div>
              <p className="text-sm font-medium text-muted">Meilleure activité</p>
              <p className="font-semibold">{bestActivity.name}</p>
              <p className="text-sm text-muted">{bestActivity.drawCount} draws</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
