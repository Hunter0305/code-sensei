import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Bot, GitBranch, Target,
  Map, FolderOpen, BarChart2, Settings,
  Zap, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'AI Mentor', path: '/mentor', icon: Bot },
  { label: 'Learning Graph', path: '/graph', icon: GitBranch },
  { label: 'Assessments', path: '/assessments', icon: Target },
  { label: 'Roadmap', path: '/roadmap', icon: Map },
  { label: 'Projects', path: '/projects', icon: FolderOpen },
  { label: 'Progress', path: '/progress', icon: BarChart2 },
  { label: 'Settings', path: '/settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const userInitial = user?.first_name?.[0] || user?.username?.[0] || 'U';
  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.username || 'Student';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed top-0 left-0 h-screen z-40 bg-[var(--bg-panel)] border-r border-[var(--border-default)] flex flex-col"
    >
      {/* Brand */}
      <div className={cn('flex items-center h-14 border-b border-[var(--border-default)] px-4', collapsed ? 'justify-center' : 'gap-2.5')}>
        <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center shrink-0">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-[15px] font-semibold text-[var(--text-primary)] tracking-tight">
            Code Sensei
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 no-scrollbar">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 h-8 px-2.5 rounded-md text-[13px] font-medium transition-colors duration-100',
                    isActive
                      ? 'bg-[var(--bg-active)] text-[var(--text-primary)]'
                      : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
                    collapsed && 'justify-center px-0'
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={cn('w-4 h-4 shrink-0', isActive && 'text-[var(--accent)]')} strokeWidth={1.5} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-[var(--border-default)] p-3">
        <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
          <div className="w-7 h-7 rounded-full bg-[var(--accent-tint)] border border-[rgba(94,106,210,0.3)] flex items-center justify-center shrink-0">
            <span className="text-[11px] font-semibold text-[var(--accent-light)]">
              {userInitial.toUpperCase()}
            </span>
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-[var(--text-primary)] truncate">{displayName}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 rounded text-[var(--text-quaternary)] hover:text-[var(--danger)] transition-colors"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className={cn(
          'absolute -right-3 top-[72px] w-6 h-6 rounded-full',
          'bg-[var(--bg-elevated)] border border-[var(--border-default)]',
          'flex items-center justify-center',
          'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors',
        )}
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3" />
          : <ChevronLeft className="w-3 h-3" />
        }
      </button>
    </motion.aside>
  );
};
