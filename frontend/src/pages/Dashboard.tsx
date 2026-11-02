import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useAuthStore } from '../store/authStore';
import { Target, GitBranch, Bot, ArrowRight, Layers, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';

interface GraphStats {
  total: number;
  mastered: number;
  developing: number;
  weak: number;
  critical: number;
  not_started: number;
}

const Dashboard: React.FC = () => {
  const { user, fetchUser } = useAuthStore();
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
    const loadStats = async () => {
      try {
        const { data } = await api.get('/learning/graph/');
        const nodes = data.nodes || data || [];
        const s: GraphStats = { total: 0, mastered: 0, developing: 0, weak: 0, critical: 0, not_started: 0 };
        if (Array.isArray(nodes)) {
          s.total = nodes.length;
          nodes.forEach((n: any) => {
            const st = n.mastery_state || 'not_started';
            if (st === 'strong') s.mastered++;
            else if (st === 'developing') s.developing++;
            else if (st === 'weak') s.weak++;
            else if (st === 'critical') s.critical++;
            else s.not_started++;
          });
        }
        setStats(s);
      } catch { setStats({ total: 0, mastered: 0, developing: 0, weak: 0, critical: 0, not_started: 0 }); }
      finally { setLoading(false); }
    };
    loadStats();
  }, []);

  const displayName = user?.first_name || user?.username || 'Student';

  const statCards = stats ? [
    { icon: Layers, label: 'Total Concepts', value: stats.total, color: 'var(--accent)' },
    { icon: CheckCircle2, label: 'Mastered', value: stats.mastered, color: 'var(--success)' },
    { icon: TrendingUp, label: 'Developing', value: stats.developing, color: 'var(--info)' },
    { icon: AlertTriangle, label: 'Needs Work', value: stats.weak + stats.critical, color: 'var(--warning)' },
  ] : [];

  const actions = [
    { icon: Target, title: 'Start Practicing', desc: 'Attempt problems to build mastery', path: '/assessments' },
    { icon: GitBranch, title: 'View Memory Graph', desc: 'See your knowledge landscape', path: '/graph' },
    { icon: Bot, title: 'Ask AI Mentor', desc: 'Get personalized guidance', path: '/mentor' },
  ];

  return (
    <AppLayout title="Dashboard" subtitle={`Welcome back, ${displayName}`}>
      {/* Welcome banner */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[200px] h-[150px] bg-[var(--accent)] opacity-[0.06] blur-[60px] pointer-events-none" />
        <h2 className="text-[18px] font-medium text-[var(--text-primary)] mb-1 relative z-10">Welcome back, {displayName}</h2>
        <p className="text-[14px] text-[var(--text-tertiary)] relative z-10">Continue your learning journey where you left off.</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-5 hover:border-[var(--border-default)] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: `${s.color}15` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} strokeWidth={1.5} />
              </div>
              <p className="text-[28px] font-semibold text-[var(--text-primary)] tracking-tight">{s.value}</p>
              <p className="text-[12px] text-[var(--text-tertiary)]">{s.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-4">
        {actions.map((a, i) => (
          <motion.div
            key={a.title}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.04 }}
          >
            <Link
              to={a.path}
              className="block bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-5 hover:border-[var(--border-default)] hover:-translate-y-px transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--accent-tint)] flex items-center justify-center">
                  <a.icon className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--text-quaternary)] group-hover:text-[var(--text-tertiary)] group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-1">{a.title}</h3>
              <p className="text-[13px] text-[var(--text-tertiary)]">{a.desc}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
