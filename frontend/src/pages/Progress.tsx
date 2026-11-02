import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import api from '../lib/api';
import { 
  BarChart2, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Target, 
  Brain, 
  Flame, 
  Zap, 
  ArrowRight, 
  Code2, 
  Layers, 
  RefreshCw,
  Compass
} from 'lucide-react';
import { motion } from 'framer-motion';

interface OverviewMetrics {
  total_concepts: number;
  mastered_count: number;
  developing_count: number;
  weak_count: number;
  critical_count: number;
  not_started_count: number;
  average_mastery: number;
  average_confidence: number;
  total_attempts: number;
  accuracy_rate: number;
  repeated_mistakes: number;
}

interface TierProgress {
  name: string;
  total: number;
  mastered: number;
  average_score: number;
  completion_pct: number;
}

interface ConceptReview {
  id: number;
  name: string;
  difficulty: number;
  state: string;
  score: number;
  attempts: number;
}

export const Progress: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [tiers, setTiers] = useState<TierProgress[]>([]);
  const [needsReview, setNeedsReview] = useState<ConceptReview[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsRes, profileRes] = await Promise.all([
        api.get('/learning/progress/analytics/'),
        api.get('/auth/profile/'),
      ]);
      setOverview(analyticsRes.data.overview);
      setTiers(analyticsRes.data.tiers || []);
      setNeedsReview(analyticsRes.data.needs_review || []);
      setUserProfile(profileRes.data);
    } catch (err) {
      console.error('Failed to load progress analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    // Auto-refresh when user returns to this tab
    const handleFocus = () => {
      fetchAnalytics();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <AppLayout
      title="Growth & Mastery Progress"
      subtitle="Real-time telemetry on concept retention, cognitive velocity, and curriculum mastery"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={() => fetchAnalytics()}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Compass className="w-3.5 h-3.5" />}
            onClick={() => navigate('/roadmap')}
          >
            Roadmap
          </Button>
          <Button
            size="sm"
            icon={<Target className="w-3.5 h-3.5" />}
            onClick={() => navigate('/graph')}
          >
            Skill Tree
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="max-w-5xl mx-auto space-y-6 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl animate-pulse" />
        </div>
      ) : (
        <div className="max-w-5xl mx-auto py-2 space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Overall Mastery Score */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-5 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[var(--text-tertiary)]">Overall Mastery</span>
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-tint)] border border-[var(--accent)] flex items-center justify-center text-[var(--accent-light)]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-1">
                {overview?.average_mastery || 0}%
              </div>
              <div className="text-xs text-[var(--text-quaternary)]">
                Average across {overview?.total_concepts || 20} curriculum nodes
              </div>
            </motion.div>

            {/* Mastered Concepts */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-5 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[var(--text-tertiary)]">Concepts Mastered</span>
                <div className="w-8 h-8 rounded-lg bg-[rgba(76,183,130,0.12)] border border-[rgba(76,183,130,0.25)] flex items-center justify-center text-[#4CB782]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-1">
                {overview?.mastered_count || 0} / {overview?.total_concepts || 20}
              </div>
              <div className="text-xs text-[var(--text-quaternary)]">
                {overview?.developing_count || 0} currently developing
              </div>
            </motion.div>

            {/* Accuracy & Attempts */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-5 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[var(--text-tertiary)]">Accuracy Rate</span>
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400">
                  <Brain className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-1">
                {overview?.accuracy_rate || 0}%
              </div>
              <div className="text-xs text-[var(--text-quaternary)]">
                Over {overview?.total_attempts || 0} code submissions
              </div>
            </motion.div>

            {/* Learning Streak & Level */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-5 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[var(--text-tertiary)]">Learning Streak</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-1">
                {userProfile?.profile?.streak || 1} Days
              </div>
              <div className="text-xs text-[var(--text-quaternary)]">
                Rank: {userProfile?.profile?.level || 'Beginner'} ({userProfile?.profile?.total_xp || 0} XP)
              </div>
            </motion.div>
          </div>

          {/* Curriculum Tier Breakdown & Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tiers Progress (2 Columns) */}
            <div className="lg:col-span-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">Curriculum Progression</h3>
                  <p className="text-xs text-[var(--text-tertiary)]">Mastery trajectory across foundational and algorithmic tiers</p>
                </div>
                <Badge variant="accent">Python Track</Badge>
              </div>

              <div className="space-y-4">
                {tiers.map((tier, idx) => (
                  <div key={idx} className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl p-4">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold text-[var(--text-primary)]">{tier.name}</span>
                      <span className="text-[var(--text-tertiary)]">
                        {tier.mastered} of {tier.total} Mastered ({tier.completion_pct}%)
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--accent)] to-[#4CB782] rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(tier.completion_pct, tier.average_score > 0 ? 8 : 0)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[var(--text-quaternary)] mt-2">
                      <span>Avg. Concept Score: {tier.average_score}%</span>
                      <span>{tier.total - tier.mastered} remaining</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Knowledge State Distribution */}
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">Knowledge States</h3>
                <p className="text-xs text-[var(--text-tertiary)] mb-4">Distribution across the 5 mastery categories</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-base)] border border-[rgba(76,183,130,0.2)]">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#4CB782]" />
                      <span className="text-xs font-medium text-[var(--text-primary)]">Mastered (Score ≥ 75)</span>
                    </div>
                    <span className="text-xs font-bold text-[#4CB782]">{overview?.mastered_count || 0}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-base)] border border-[rgba(78,167,252,0.2)]">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#4EA7FC]" />
                      <span className="text-xs font-medium text-[var(--text-primary)]">Developing (45–74)</span>
                    </div>
                    <span className="text-xs font-bold text-[#4EA7FC]">{overview?.developing_count || 0}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-base)] border border-[rgba(242,201,76,0.2)]">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#F2C94C]" />
                      <span className="text-xs font-medium text-[var(--text-primary)]">Weak / Review (&lt; 45)</span>
                    </div>
                    <span className="text-xs font-bold text-[#F2C94C]">{overview?.weak_count || 0}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-base)] border border-[rgba(235,87,87,0.2)]">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#EB5757]" />
                      <span className="text-xs font-medium text-[var(--text-primary)]">Critical (Mistakes ≥ 3)</span>
                    </div>
                    <span className="text-xs font-bold text-[#EB5757]">{overview?.critical_count || 0}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#62666D]" />
                      <span className="text-xs font-medium text-[var(--text-secondary)]">Not Started</span>
                    </div>
                    <span className="text-xs font-bold text-[var(--text-secondary)]">{overview?.not_started_count || 0}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  onClick={() => navigate('/graph')}
                >
                  Explore Interactive Graph
                </Button>
              </div>
            </div>
          </div>

          {/* AI Recommended Focus Concepts */}
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <h3 className="text-base font-semibold text-[var(--text-primary)]">Pedagogical Recommendations</h3>
              </div>
              <span className="text-xs text-[var(--text-tertiary)]">Auto-identified from error frequency & graph prerequisites</span>
            </div>

            {needsReview.length === 0 ? (
              <div className="text-center py-8 bg-[var(--bg-base)] rounded-xl border border-[var(--border-subtle)]">
                <CheckCircle2 className="w-8 h-8 text-[#4CB782] mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">No Critical Knowledge Gaps</h4>
                <p className="text-xs text-[var(--text-tertiary)] max-w-md mx-auto mb-4">
                  You are making steady progress! Continue with your active roadmap milestones to unlock advanced concepts.
                </p>
                <Button size="sm" onClick={() => navigate('/roadmap')}>
                  Go to Active Roadmap
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {needsReview.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-center justify-between group hover:border-[var(--accent)] transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{item.name}</span>
                        <Badge variant={item.state === 'critical' ? 'danger' : 'warning'}>
                          {item.state}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        Mastery score: <span className="text-[var(--text-secondary)] font-medium">{item.score}%</span> • {item.attempts} attempts
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate('/assessments')}
                        icon={<Code2 className="w-3.5 h-3.5" />}
                      >
                        Practice
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Progress;
