import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]',
  secondary: 'bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
  ghost: 'bg-transparent text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
  danger: 'bg-[rgba(235,87,87,0.12)] text-[var(--danger)] border border-[rgba(235,87,87,0.2)] hover:bg-[rgba(235,87,87,0.2)]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1.5',
  md: 'h-8 px-3 text-[13px] gap-2',
  lg: 'h-10 px-4 text-sm gap-2',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150',
          'focus-visible:outline-2 focus-visible:outline-[rgba(94,106,210,0.5)] focus-visible:outline-offset-2',
          'cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || loading}
        {...(props as any)}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
