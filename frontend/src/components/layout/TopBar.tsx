import React from 'react';
import { Bell } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle, actions }) => {
  const { user } = useAuthStore();
  const userInitial = user?.first_name?.[0] || user?.username?.[0] || 'U';

  return (
    <div className="px-4 pt-4 pb-2 shrink-0 z-10">
      <header className="h-12 flex items-center justify-between px-5 glass rounded-full">
        <div>
          <h1 className="text-[15px] font-medium text-[var(--text-primary)]">{title}</h1>
          {subtitle && (
            <p className="text-[12px] text-[var(--text-tertiary)]">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          {actions}
          <button className="relative w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">
            <Bell className="w-4 h-4" strokeWidth={1.5} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[var(--danger)] rounded-full" />
          </button>
          <div className="w-8 h-8 rounded-full bg-[var(--accent-tint)] border border-[rgba(94,106,210,0.3)] flex items-center justify-center">
            <span className="text-[11px] font-semibold text-[var(--accent-light)]">
              {userInitial.toUpperCase()}
            </span>
          </div>
        </div>
      </header>
    </div>
  );
};
