/**
 * LoadingState — Skeleton loader and spinner
 */
import React from 'react';
import { Loader2, Zap } from 'lucide-react';
import { cn } from '../../utils/cn';

interface LoadingStateProps {
  message?: string;
  variant?: 'spinner' | 'page' | 'card';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  variant = 'spinner',
  className,
}) => {
  if (variant === 'page') {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center min-h-screen bg-bg-primary gap-4',
        className
      )}>
        <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center animate-pulse-soft">
          <Zap className="w-6 h-6 text-primary-300" />
        </div>
        <p className="text-label text-text-secondary">{message}</p>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn('cs-card', className)}>
        <div className="space-y-3">
          <div className="h-4 rounded shimmer w-3/4" />
          <div className="h-4 rounded shimmer w-1/2" />
          <div className="h-4 rounded shimmer w-5/6" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-center gap-2 py-8', className)}>
      <Loader2 className="w-5 h-5 text-primary animate-spin" />
      <span className="text-label text-text-secondary">{message}</span>
    </div>
  );
};

/**
 * ErrorState — Error display with retry
 */
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Something went wrong.',
  onRetry,
  className,
}) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-4 py-12 text-center',
      className
    )}>
      <div className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center">
        <span className="text-2xl">⚠️</span>
      </div>
      <div>
        <p className="text-body-md text-text-primary font-medium">Something went wrong</p>
        <p className="text-label text-text-secondary mt-1">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="cs-btn cs-btn-ghost cs-btn-sm"
        >
          Try again
        </button>
      )}
    </div>
  );
};

export default LoadingState;
