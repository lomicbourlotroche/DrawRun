import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      role="generic"
      className={cn('animate-pulse bg-surface rounded-md', className)}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div role="generic" className="bg-surface border border-border rounded-lg p-4 md:p-6">
      <Skeleton className="h-4 w-1/3 mb-4" />
      <Skeleton className="h-8 w-1/2 mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div role="generic" className="bg-surface border border-border rounded-lg p-4">
      <div aria-label="flex items-center gap-4" className="flex items-center gap-4">
        <Skeleton aria-label="rounded-full" className="w-12 h-12 rounded-full" />
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

export function ChartSkeleton() {
  return (
    <div role="generic" className="bg-surface border border-border rounded-lg p-4 md:p-6">
      <Skeleton aria-label="h-4 w-1/4" className="h-4 w-1/4 mb-4" />
      <Skeleton aria-label="h-48 w-full" className="h-48 w-full" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div role="generic" className="space-y-6 animate-fade-in">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div aria-label="grid grid-cols-2 lg:grid-cols-4 gap-4" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      <ChartSkeleton />

      <div aria-label="bg-surface border border-border rounded-lg p-4 md:p-6" className="bg-surface border border-border rounded-lg p-4 md:p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function ActivitiesSkeleton() {
  return (
    <div role="generic" className="space-y-6 animate-fade-in">
      <div aria-label="flex justify-between items-center" className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div aria-label="space-y-4" className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <ActivitySkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div role="generic" className="space-y-6 animate-fade-in">
      <div aria-label="flex items-center gap-6" className="bg-surface border border-border rounded-lg p-6 flex items-center gap-6">
        <Skeleton aria-label="h-24 w-24 rounded-full" className="h-24 w-24 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <div aria-label="space-y-4" className="bg-surface border border-border rounded-lg p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton aria-label="h-12 w-32" className="h-12 w-32 mt-4" />
      </div>
    </div>
  );
}

export function CoachSkeleton() {
  return (
    <div role="generic" className="space-y-6 animate-fade-in">
      <Skeleton aria-label="h-8 w-40" className="h-8 w-40 mb-2" />
      
      <div aria-label="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function SocialSkeleton() {
  return (
    <div role="generic" className="space-y-6 animate-fade-in">
      <div aria-label="flex gap-2 border-b border-border pb-4" className="flex gap-2 border-b border-border pb-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} aria-label="h-10 w-24" className="h-10 w-24" />
        ))}
      </div>

      <div aria-label="space-y-4" className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-lg p-4">
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

export function PerformanceSkeleton() {
  return (
    <div role="generic" className="space-y-6 animate-fade-in">
      <Skeleton aria-label="h-8 w-48" className="h-8 w-48 mb-2" />
      
      <div aria-label="grid grid-cols-2 lg:grid-cols-4 gap-4" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} aria-label="h-24 w-full" className="h-24 w-full rounded-xl" />
        ))}
      </div>

      <div aria-label="grid grid-cols-1 lg:grid-cols-2 gap-6" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}

export function PageSkeleton({ title = true }: { title?: boolean }) {
  return (
    <div role="generic" className="space-y-6 animate-fade-in">
      {title && <Skeleton aria-label="h-8 w-48" className="h-8 w-48" />}
      <div aria-label="bg-surface border border-border rounded-lg p-6 space-y-4" className="bg-surface border border-border rounded-lg p-6 space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}
