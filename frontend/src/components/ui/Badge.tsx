import React from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant = 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const badgeStyles: Record<BadgeVariant, string> = {
  accent: 'bg-[var(--accent-tint)] text-[var(--accent-light)] border-[rgba(94,106,210,0.25)]',
  success: 'bg-[rgba(76,183,130,0.12)] text-[#4CB782] border-[rgba(76,183,130,0.25)]',
  warning: 'bg-[rgba(242,201,76,0.12)] text-[#F2C94C] border-[rgba(242,201,76,0.25)]',
  danger: 'bg-[rgba(235,87,87,0.12)] text-[#EB5757] border-[rgba(235,87,87,0.25)]',
  info: 'bg-[rgba(78,167,252,0.12)] text-[#4EA7FC] border-[rgba(78,167,252,0.25)]',
  neutral: 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)] border-[var(--border-default)]',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium tracking-wide border',
      badgeStyles[variant],
      className
    )}
  >
    {children}
  </span>
);
