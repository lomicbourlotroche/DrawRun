import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

// Composant Skeleton de base avec effet shimmer
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Chargement..."
      className={cn('bg-muted/30 rounded-md animate-shimmer', className)}
      {...props}
    />
  );
}

// Skeleton pour une carte complète
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Carte en chargement"
      className={cn('bg-surface border border-border rounded-xl p-4 md:p-6', className)}
    >
      <Skeleton className="h-4 w-1/3 mb-4" />
      <Skeleton className="h-8 w-1/2 mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

// Skeleton pour une activité dans une liste
export function ActivitySkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Activité en chargement"
      className={cn('bg-surface border border-border rounded-xl p-4', className)}
    >
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <div className="text-right">
          <Skeleton className="h-5 w-16 mb-1" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

// Skeleton pour un graphique
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Graphique en chargement"
      className={cn('bg-surface border border-border rounded-xl p-4 md:p-6', className)}
    >
      <Skeleton className="h-4 w-1/4 mb-4" />
      <div className="space-y-2">
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="flex justify-between">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-2 w-1" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton pour le tableau de bord complet
export function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div role="status" aria-label="Tableau de bord en chargement" className={cn('space-y-6', className)}>
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      <ChartSkeleton />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4 md:p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton pour la liste des activités
export function ActivitiesSkeleton({ className }: { className?: string }) {
  return (
    <div role="status" aria-label="Activités en chargement" className={cn('space-y-4', className)}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <ActivitySkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Skeleton pour la page de profil
export function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div role="status" aria-label="Profil en chargement" className={cn('space-y-6', className)}>
      <div className="bg-surface border border-border rounded-xl p-6 flex items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-12 w-32 mt-4" />
      </div>
    </div>
  );
}

// Skeleton pour la page coach
export function CoachSkeleton({ className }: { className?: string }) {
  return (
    <div role="status" aria-label="Coach en chargement" className={cn('space-y-6', className)}>
      <Skeleton className="h-8 w-40 mb-2" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Skeleton pour la page sociale
export function SocialSkeleton({ className }: { className?: string }) {
  return (
    <div role="status" aria-label="Réseau social en chargement" className={cn('space-y-6', className)}>
      <div className="flex gap-2 border-b border-border pb-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-24" />
        ))}
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton pour la page performance
export function PerformanceSkeleton({ className }: { className?: string }) {
  return (
    <div role="status" aria-label="Performance en chargement" className={cn('space-y-6', className)}>
      <Skeleton className="h-8 w-48 mb-2" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}

// Skeleton pour une page générique
export function PageSkeleton({ title = true, className }: { title?: boolean; className?: string }) {
  return (
    <div role="status" aria-label="Page en chargement" className={cn('space-y-6', className)}>
      {title && <Skeleton className="h-8 w-48" />}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}

// Skeleton pour un tableau
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label="Tableau en chargement"
      className={cn('bg-surface border border-border rounded-xl overflow-hidden', className)}
    >
      {/* Header */}
      <div className="flex border-b border-border p-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full mx-2" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className={cn('flex border-b border-border p-4', rowIndex === rows - 1 && 'border-b-0')}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 w-full mx-2" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Skeleton pour une carte de métrique
export function MetricCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Métrique en chargement"
      className={cn('bg-surface border border-border rounded-xl p-4', className)}
    >
      <Skeleton className="h-3 w-20 mb-2" />
      <div className="flex items-baseline gap-1">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-4 w-8" />
      </div>
    </div>
  );
}

// Skeleton pour un badge
export function BadgeSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-6 w-16 rounded-full', className)} />;
}

// Skeleton pour une ligne de stats
export function StatRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Statistique en chargement"
      className={cn('flex items-center justify-between py-3 border-b border-border last:border-0', className)}
    >
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}
