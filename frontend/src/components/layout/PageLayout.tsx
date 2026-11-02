/**
 * PageLayout — Authenticated page shell with sidebar + topbar
 */
import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../utils/cn';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuthStore();

  const userInitial = user?.first_name?.[0] || user?.username?.[0] || 'U';

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content area */}
      <main
        className={cn(
          'flex-1 flex flex-col min-h-screen overflow-hidden',
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-60'
        )}
      >
        {/* Topbar as Floating Pill */}
        <div className="p-4 shrink-0 z-10">
          <header className="h-16 flex items-center justify-between px-6 border border-border-subtle bg-bg-surface/60 backdrop-blur-md rounded-full shadow-card">
            <div>
              {title && (
                <h1 className="text-heading-md font-heading text-text-primary">{title}</h1>
              )}
              {subtitle && (
                <p className="text-label-sm text-text-secondary">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {actions}
              {/* Notification bell */}
              <button className="w-9 h-9 rounded-full border border-border-default flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-interactive">
                <Bell className="w-4 h-4" />
              </button>
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <span className="text-label-sm font-semibold text-primary-300">
                  {userInitial.toUpperCase()}
                </span>
              </div>
            </div>
          </header>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default PageLayout;
