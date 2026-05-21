import React from 'react';
import { cn } from '@/lib/utils';
import { Activity, Calendar, Users, Trophy, BarChart3, Heart, TrendingUp, Clock, HelpCircle } from 'lucide-react';

export interface EmptyStateProps {
  type?: 'activities' | 'dashboard' | 'performance' | 'coach' | 'social' | 'friends' | 'feed' | 'leaderboard' | 'plans' | 'data' | 'generic';
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

const emptyStateConfigs: Record<string, {
  icon: React.ReactNode;
  title: string;
  description: string;
}> = {
  activities: {
    icon: <Activity className="w-8 h-8" />,
    title: 'Aucune activité récente',
    description: 'Commencez par enregistrer une activité pour voir vos données d\'entraînement.',
  },
  dashboard: {
    icon: <BarChart3 className="w-8 h-8" />,
    title: 'Bienvenue sur votre dashboard',
    description: 'Vos statistiques et graphiques de performance apparaîtront ici.',
  },
  performance: {
    icon: <TrendingUp className="w-8 h-8" />,
    title: 'Aucune donnée de performance',
    description: 'Effectuez des activités pour analyser vos performances et progressions.',
  },
  coach: {
    icon: <Calendar className="w-8 h-8" />,
    title: 'Aucun plan d\'entraînement',
    description: 'Créez ou sélectionnez un plan pour commencer votre entraînement structuré.',
  },
  social: {
    icon: <Users className="w-8 h-8" />,
    title: 'Votre réseau est vide',
    description: 'Ajoutez des amis pour partager vos activités et défis.',
  },
  friends: {
    icon: <Users className="w-8 h-8" />,
    title: 'Aucun ami trouvé',
    description: 'Recherchez des utilisateurs pour les ajouter à votre liste d\'amis.',
  },
  feed: {
    icon: <TrendingUp className="w-8 h-8" />,
    title: 'Votre fil d\'actualité est vide',
    description: 'Suivez des amis pour voir leurs activités récentes.',
  },
  leaderboard: {
    icon: <Trophy className="w-8 h-8" />,
    title: 'Aucun classement disponible',
    description: 'Effectuez des activités pour apparaître dans le classement.',
  },
  plans: {
    icon: <Calendar className="w-8 h-8" />,
    title: 'Aucun plan disponible',
    description: 'Créez un nouveau plan d\'entraînement ou contactez un coach.',
  },
  data: {
    icon: <Heart className="w-8 h-8" />,
    title: 'Aucune donnée disponible',
    description: 'Les données s\'afficheront ici une fois collectées.',
  },
  generic: {
    icon: <HelpCircle className="w-8 h-8" />,
    title: 'Aucun élément à afficher',
    description: 'Il semble qu\'il n\'y ait rien à montrer pour le moment.',
  },
};

export function EmptyState({
  type = 'generic',
  title,
  description,
  icon,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  const config = emptyStateConfigs[type] || emptyStateConfigs.generic;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;
  const displayIcon = icon || config.icon;

  return (
    <div
      role="region"
      aria-label={displayTitle}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'bg-surface border border-border rounded-2xl',
        compact ? 'p-8' : 'p-12 md:p-16',
        className
      )}
    >
      <div
        className={cn(
          'mb-6 flex items-center justify-center',
          'w-16 h-16 md:w-20 md:h-20 rounded-full',
          compact ? 'w-12 h-12' : 'w-16 h-16 md:w-20 md:h-20',
          'bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20'
        )}
      >
        {React.cloneElement(displayIcon as React.ReactElement, {
          className: cn(
            'text-primary-600 dark:text-primary-400',
            compact ? 'w-6 h-6' : 'w-8 h-8 md:w-10 md:h-10'
          ),
        })}
      </div>

      <h3
        className={cn(
          'font-bold text-foreground',
          compact ? 'text-lg' : 'text-xl md:text-2xl'
        )}
      >
        {displayTitle}
      </h3>

      {displayDescription && (
        <p
          className={cn(
            'mt-3 text-muted',
            compact ? 'text-sm' : 'text-sm md:text-base'
          )}
        >
          {displayDescription}
        </p>
      )}

      {action && (
        <div className={cn('mt-6', compact ? 'mt-4' : 'mt-6')}>
          {action}
        </div>
      )}
    </div>
  );
}

// Variants spécifiques pour des cas particuliers
export function EmptyStateWithIllustration({
  illustration,
  title,
  description,
  action,
  className,
}: {
  illustration: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="region"
      aria-label={title}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'bg-surface border border-border rounded-2xl p-12 md:p-16',
        className
      )}
    >
      <div className="mb-8 text-primary-200 dark:text-primary-800/30">
        {illustration}
      </div>

      <h3 className="text-xl md:text-2xl font-bold text-foreground">
        {title}
      </h3>

      <p className="mt-3 text-muted text-sm md:text-base max-w-md">
        {description}
      </p>

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function EmptyChart({
  type = 'line',
  title = 'Aucune donnée à afficher',
  description = 'Effectuez des activités pour voir vos graphiques',
  className,
}: {
  type?: 'line' | 'bar' | 'area' | 'pie';
  title?: string;
  description?: string;
  className?: string;
}) {
  const icons = {
    line: <TrendingUp className="w-6 h-6" />,
    bar: <BarChart3 className="w-6 h-6" />,
    area: <Heart className="w-6 h-6" />,
    pie: <Clock className="w-6 h-6" />,
  };

  return (
    <div
      role="region"
      aria-label={title}
      className={cn(
        'flex flex-col items-center justify-center',
        'bg-surface border border-border rounded-2xl p-12',
        'min-h-[300px] md:min-h-[400px]',
        className
      )}
    >
      <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
        {icons[type]}
      </div>
      <h4 className="font-semibold text-foreground">{title}</h4>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </div>
  );
}

export function EmptyList({
  title = 'Aucun élément dans la liste',
  description,
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="region"
      aria-label={title}
      className={cn(
        'flex flex-col items-center justify-center py-12',
        className
      )}
    >
      <div className="mb-4 flex items-center justify-center w-10 h-10 rounded-full bg-surface border border-border">
        <Activity className="w-5 h-5 text-muted" />
      </div>
      <h4 className="font-medium text-foreground">{title}</h4>
      {description && (
        <p className="mt-2 text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Composant pour les empty states de tableau
export function EmptyTable({
  columns = 4,
  title = 'Aucune donnée disponible',
  description,
  action,
  className,
}: {
  columns?: number;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="region"
      aria-label={title}
      className={cn('w-full', className)}
    >
      <div
        className={cn(
          'flex flex-col items-center justify-center py-12',
          'bg-surface border border-border rounded-xl'
        )}
      >
        <div className="mb-4 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
          <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <h4 className="font-semibold text-foreground">{title}</h4>
        {description && (
          <p className="mt-2 text-sm text-muted max-w-xs">{description}</p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}
