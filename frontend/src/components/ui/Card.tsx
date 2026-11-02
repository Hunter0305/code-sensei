/**
 * Card — Surface card component with optional hover effects
 */
import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const paddingClasses = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = false,
  padding = 'md',
  onClick,
}) => {
  return (
    <div
      className={cn(
        'cs-card',
        paddingClasses[padding],
        hover && 'cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// ──────────────────────────────────────────────
// StatCard — Dashboard metric card
// ──────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  accentColor?: 'purple' | 'blue' | 'green' | 'orange';
  className?: string;
}

const accentMap = {
  purple: 'stat-card-purple',
  blue: 'stat-card-blue',
  green: 'stat-card-green',
  orange: 'stat-card-orange',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accentColor = 'purple',
  className,
}) => {
  return (
    <div className={cn('stat-card', accentMap[accentColor], className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-label text-text-secondary mb-1">{title}</p>
          <p className="text-display-sm font-bold text-text-primary font-heading">{value}</p>
          {subtitle && (
            <p className="text-label-sm text-text-muted mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            accentColor === 'purple' && 'bg-primary/15 text-primary-300',
            accentColor === 'blue' && 'bg-secondary/15 text-secondary-400',
            accentColor === 'green' && 'bg-success/15 text-success-400',
            accentColor === 'orange' && 'bg-warning/15 text-warning-400',
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
