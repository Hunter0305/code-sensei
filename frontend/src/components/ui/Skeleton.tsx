import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, lines = 1 }) => {
  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn('skeleton h-4', i === lines - 1 ? 'w-3/4' : 'w-full', className)}
          />
        ))}
      </div>
    );
  }
  return <div className={cn('skeleton h-4 w-full', className)} />;
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-5', className)}>
    <Skeleton className="h-5 w-1/3 mb-3" />
    <Skeleton lines={2} />
    <Skeleton className="h-8 w-24 mt-4" />
  </div>
);
