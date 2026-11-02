import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Zap } from 'lucide-react';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center mt-4 px-4">
      <header
        className={cn(
          'w-full max-w-4xl rounded-full transition-all duration-300 border',
          scrolled
            ? 'glass shadow-[var(--shadow-float)]'
            : 'bg-transparent border-transparent'
        )}
      >
        <div className="flex items-center justify-between h-12 px-5">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[var(--accent)] flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-[14px] font-semibold text-[var(--text-primary)] tracking-tight">
              Code Sensei
            </span>
          </Link>

          {/* Center links */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">Features</a>
            <a href="#how-it-works" className="text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">How it works</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>
    </div>
  );
};
