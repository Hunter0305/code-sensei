import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SkeletonCard } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import api from '../lib/api';
import { Code2, Search, ChevronRight, Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface Problem {
  id: number;
  title: string;
  difficulty: string;
  concept_name: string;
}

const DIFF_VARIANTS: Record<string, 'success' | 'warning' | 'danger'> = {
  easy: 'success', medium: 'warning', hard: 'danger',
};

const ProblemList: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const { data } = await api.get('/assessments/problems/');
        setProblems(data.results || data || []);
      } catch (err) {
        console.error('Failed to fetch problems', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, []);

  const filtered = problems.filter((p) => {
    if (diffFilter !== 'all' && p.difficulty !== diffFilter) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AppLayout title="Assessments" subtitle="Practice problems to test your knowledge">
      {/* Search and filters */}
      <div className="mb-5">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-quaternary)]" strokeWidth={1.5} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems..."
            className="w-full h-9 pl-10 pr-4 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-quaternary)] focus:outline-none focus:border-[rgba(94,106,210,0.5)] transition-colors"
          />
        </div>
        <div className="flex gap-1.5">
          {['all', 'easy', 'medium', 'hard'].map((d) => (
            <button
              key={d}
              onClick={() => setDiffFilter(d)}
              className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all ${
                diffFilter === d
                  ? 'bg-[var(--accent-tint)] text-[var(--accent-light)]'
                  : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] border border-[var(--border-default)]'
              }`}
            >
              {d === 'all' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Problem cards */}
      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Target className="w-5 h-5" />}
          title="No problems found"
          description={search ? 'Try a different search term' : 'No problems available yet.'}
        />
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => navigate(`/workspace/${p.id}`)}
              className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-5 cursor-pointer hover:border-[var(--border-default)] hover:-translate-y-px transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-[15px] font-medium text-[var(--text-primary)]">{p.title}</h3>
                <ChevronRight className="w-4 h-4 text-[var(--text-quaternary)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={DIFF_VARIANTS[p.difficulty] || 'neutral'}>
                  {p.difficulty.toUpperCase()}
                </Badge>
                <span className="text-[12px] text-[var(--text-quaternary)]">{p.concept_name}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default ProblemList;
