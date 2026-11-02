import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { motion } from 'framer-motion';

interface AppLayoutProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  fullHeight?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ title, subtitle, actions, children, fullHeight }) => {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  const sidebarWidth = collapsed ? 64 : 240;

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-[var(--bg-base)]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <motion.main
        animate={{
          marginLeft: sidebarWidth,
          width: `calc(100vw - ${sidebarWidth}px)`,
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`flex flex-col min-w-0 overflow-hidden ${
          fullHeight ? 'h-screen max-h-screen' : 'min-h-screen'
        }`}
      >
        <TopBar title={title} subtitle={subtitle} actions={actions} />
        <div className={`flex-1 min-h-0 min-w-0 ${fullHeight ? 'h-[calc(100vh-72px)] overflow-hidden' : 'overflow-y-auto'}`}>
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={fullHeight ? 'h-full w-full min-h-0 min-w-0 overflow-hidden' : 'px-6 pb-6'}
          >
            {children}
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
};
