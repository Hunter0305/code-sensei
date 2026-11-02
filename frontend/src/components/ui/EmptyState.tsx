import React from 'react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className }) => (
  <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
    <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-quaternary)] mb-4">
      {icon}
    </div>
    <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-1">{title}</h3>
    <p className="text-[13px] text-[var(--text-tertiary)] max-w-sm mb-4">{description}</p>
    {action}
  </div>
);
