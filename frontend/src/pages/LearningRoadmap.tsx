import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { roadmapService, type LearningRoadmap as IRoadmap, type RoadmapNode } from '../services/roadmapService';
import { 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  Circle, 
  ArrowRight, 
  Target, 
  MessageSquare, 
  Code2, 
  Compass, 
  RefreshCw,
  Layers,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const PRESET_GOALS = [
  {
    title: 'Python & Data Structures Mastery',
    desc: 'From core primitives to complex hierarchical trees and graphs.',
    icon: '🌳',
  },
  {
    title: 'Ace Coding Interviews & LeetCode',
    desc: 'Focus on recursion, algorithmic time complexity, and dynamic programming.',
    icon: '⚡',
  },
  {
    title: 'Object-Oriented Design & Clean Architecture',
    desc: 'Deep dive into OOP, inheritance, decorators, and modular abstractions.',
    icon: '🏛️',
  },
  {
    title: 'Fast-Track Foundations for Beginners',
    desc: 'Build rock-solid syntax intuition across variables, loops, and collections.',
    icon: '🚀',
  },
];

export const LearningRoadmap: React.FC = () => {
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState<IRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [customGoal, setCustomGoal] = useState('');
  const [updatingNodeId, setUpdatingNodeId] = useState<number | null>(null);

  const fetchActiveRoadmap = async () => {
    try {
      setLoading(true);
      const data = await roadmapService.getActiveRoadmap();
      setRoadmap(data);
    } catch (err) {
      console.error('Failed to load roadmap:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveRoadmap();
  }, []);

  const handleGenerate = async (targetGoal?: string) => {
    const goalToUse = targetGoal || customGoal.trim() || 'Master Python & Algorithmic Problem Solving';
    setGenerating(true);
    setShowGoalModal(false);
    const toastId = toast.loading('AI is crafting your tailored roadmap...');
    try {
      const newRoadmap = await roadmapService.generateRoadmap(goalToUse);
      setRoadmap(newRoadmap);
      toast.success('Your personalized roadmap is ready!', { id: toastId });
    } catch (err: any) {
      console.error('Failed to generate roadmap:', err);
      toast.error('Could not generate roadmap. Please try again.', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateStatus = async (node: RoadmapNode, nextStatus: 'pending' | 'in_progress' | 'completed') => {
    try {
      setUpdatingNodeId(node.id);
      const updated = await roadmapService.updateNodeStatus(node.id, nextStatus);
      setRoadmap(updated);
      if (nextStatus === 'completed') {
        toast.success(`Completed "${node.concept_name}"! Keep up the momentum.`);
      } else if (nextStatus === 'in_progress') {
        toast.info(`Started "${node.concept_name}".`);
      }
    } catch (err) {
      toast.error('Failed to update step status.');
    } finally {
      setUpdatingNodeId(null);
    }
  };

  const nodes = roadmap?.nodes || roadmap?.steps || [];
  const completedCount = nodes.filter((n) => n.status === 'completed').length;
  const progressPct = nodes.length > 0 ? Math.round((completedCount / nodes.length) * 100) : 0;
  const totalHours = nodes.reduce((sum, n) => sum + (n.estimated_hours || 1), 0);

  return (
    <AppLayout
      title="Learning Roadmap"
      subtitle="AI-driven curriculum dynamically tuned to your mastery and dependencies"
      actions={
        <div className="flex items-center gap-2">
          {roadmap && (
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />}
              onClick={() => handleGenerate(roadmap.goal)}
              disabled={generating}
            >
              Regenerate
            </Button>
          )}
          <Button
            size="sm"
            icon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}
            onClick={() => setShowGoalModal(true)}
            loading={generating}
          >
            New Goal Path
          </Button>
        </div>
      }
    >
      {/* Goal Customization Modal */}
      <AnimatePresence>
        {showGoalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl max-w-xl w-full p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-tint)] border border-[var(--accent)] flex items-center justify-center text-[var(--accent-light)]">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">What is your learning goal?</h3>
                    <p className="text-xs text-[var(--text-tertiary)]">The AI mentor will map prerequisite dependencies accordingly.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="text-[var(--text-quaternary)] hover:text-[var(--text-primary)] text-sm px-2 py-1"
                >
                  ✕
                </button>
              </div>

              {/* Preset Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                {PRESET_GOALS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleGenerate(preset.title)}
                    className="p-3 text-left rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] hover:border-[var(--accent)] hover:bg-[var(--bg-surface)] transition-all group"
                  >
                    <div className="text-lg mb-1">{preset.icon}</div>
                    <div className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-light)]">
                      {preset.title}
                    </div>
                    <div className="text-[11px] text-[var(--text-tertiary)] line-clamp-2 mt-0.5">
                      {preset.desc}
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Goal Input */}
              <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                  Or describe a custom ambition:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    placeholder="e.g. Build asynchronous APIs with FastAPI & Postgres"
                    className="flex-1 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-quaternary)] focus:outline-none focus:border-[var(--accent)]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customGoal.trim()) handleGenerate(customGoal);
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleGenerate(customGoal)}
                    disabled={!customGoal.trim()}
                  >
                    Generate
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      {loading ? (
        <div className="max-w-4xl mx-auto space-y-6 mt-4">
          <div className="h-32 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] animate-pulse shrink-0" />
                <div className="flex-1 h-20 bg-[var(--bg-elevated)] rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : !roadmap || nodes.length === 0 ? (
        /* Empty State */
        <div className="max-w-3xl mx-auto py-12 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent-tint)] border border-[var(--accent)] flex items-center justify-center mx-auto mb-4 text-[var(--accent-light)]">
            <Compass className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Active Learning Roadmap</h2>
          <p className="text-sm text-[var(--text-tertiary)] max-w-md mx-auto mb-8">
            Let Code Sensei examine your current concept mastery and graph prerequisites to assemble your optimal progression plan.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto text-left mb-6">
            {PRESET_GOALS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleGenerate(preset.title)}
                disabled={generating}
                className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--accent)] hover:shadow-lg transition-all group"
              >
                <div className="text-2xl mb-2">{preset.icon}</div>
                <div className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-light)] flex items-center justify-between">
                  {preset.title}
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-xs text-[var(--text-tertiary)] mt-1">{preset.desc}</div>
              </button>
            ))}
          </div>

          <Button
            size="lg"
            icon={<Sparkles className="w-4 h-4 text-amber-300" />}
            onClick={() => handleGenerate()}
            loading={generating}
          >
            Generate My Custom Roadmap
          </Button>
        </div>
      ) : (
        /* Roadmap Active View */
        <div className="max-w-4xl mx-auto py-4 space-y-6">
          {/* Header Metric Banner */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[var(--bg-elevated)] via-[var(--bg-surface)] to-[var(--bg-base)] border border-[var(--border-default)] rounded-2xl p-6 shadow-xl">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-[var(--accent-tint)] to-transparent pointer-events-none opacity-40" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="accent" className="gap-1 font-semibold">
                    <Target className="w-3 h-3" /> ACTIVE PATH
                  </Badge>
                  <span className="text-xs text-[var(--text-quaternary)]">
                    Created {new Date(roadmap.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                  {roadmap.title}
                </h2>
                {roadmap.goal && (
                  <p className="text-xs text-[var(--text-tertiary)] mt-1 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-light)]" />
                    Target: <span className="text-[var(--text-secondary)] font-medium">{roadmap.goal}</span>
                  </p>
                )}
              </div>

              {/* Progress Ring / Bar */}
              <div className="bg-[var(--bg-base)]/80 border border-[var(--border-subtle)] rounded-xl p-3.5 min-w-[200px]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[var(--text-tertiary)]">Milestones Mastered</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {completedCount} / {nodes.length} ({progressPct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--accent)] to-[#4CB782] rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[var(--text-quaternary)] mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Est. {totalHours.toFixed(1)} hrs
                  </span>
                  <span>{nodes.length - completedCount} remaining</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Nodes */}
          <div className="relative pl-6 sm:pl-10">
            {/* Vertical timeline spine */}
            <div className="absolute left-3 sm:left-5 top-8 bottom-8 w-0.5 bg-gradient-to-b from-[var(--accent)] via-[var(--border-default)] to-[var(--border-subtle)]" />

            <div className="space-y-5">
              {nodes.map((step, idx) => {
                const isCompleted = step.status === 'completed';
                const isInProgress = step.status === 'in_progress';
                const isPending = !isCompleted && !isInProgress;
                const isUpdating = updatingNodeId === step.id;

                return (
                  <motion.div
                    key={step.id || idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative flex items-start gap-4 group"
                  >
                    {/* Node Status Dot on Spine */}
                    <div
                      className={`relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                        isCompleted
                          ? 'bg-[#4CB782] border-[#4CB782] text-white shadow-md shadow-[#4CB782]/20'
                          : isInProgress
                          ? 'bg-[var(--accent)] border-[var(--accent)] text-white ring-4 ring-[var(--accent-tint)] animate-pulse'
                          : 'bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-quaternary)]'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      ) : isInProgress ? (
                        <PlayCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-semibold">{step.order || idx + 1}</span>
                      )}
                    </div>

                    {/* Step Content Card */}
                    <div
                      className={`flex-1 rounded-2xl border p-4 sm:p-5 transition-all ${
                        isInProgress
                          ? 'bg-[var(--bg-elevated)] border-[var(--accent)] shadow-lg shadow-[var(--accent-tint)]/10 ring-1 ring-[var(--accent)]/30'
                          : isCompleted
                          ? 'bg-[var(--bg-elevated)]/60 border-[rgba(76,183,130,0.3)]'
                          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-default)] opacity-90'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={`text-sm sm:text-base font-semibold ${
                              isCompleted
                                ? 'text-[var(--text-secondary)] line-through decoration-[var(--text-quaternary)]'
                                : 'text-[var(--text-primary)]'
                            }`}
                          >
                            {step.concept_name || step.title}
                          </h3>

                          {/* Status Badge */}
                          {isCompleted && <Badge variant="success">Completed</Badge>}
                          {isInProgress && (
                            <Badge variant="accent" className="animate-pulse">
                              Active Focus
                            </Badge>
                          )}
                          {isPending && <Badge variant="neutral">Upcoming</Badge>}

                          {step.estimated_hours && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-quaternary)] bg-[var(--bg-base)] px-2 py-0.5 rounded-full border border-[var(--border-subtle)]">
                              <Clock className="w-3 h-3" />
                              {step.estimated_hours}h
                            </span>
                          )}
                        </div>

                        {/* Interactive Status Controls */}
                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                          {isCompleted ? (
                            <button
                              onClick={() => handleUpdateStatus(step, 'in_progress')}
                              disabled={isUpdating}
                              className="text-xs text-[var(--text-quaternary)] hover:text-[var(--text-secondary)] transition-colors px-2 py-1 rounded"
                              title="Re-open this milestone"
                            >
                              Reset
                            </button>
                          ) : isInProgress ? (
                            <Button
                              size="sm"
                              variant="primary"
                              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              onClick={() => handleUpdateStatus(step, 'completed')}
                              loading={isUpdating}
                            >
                              Mark Completed
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={<PlayCircle className="w-3.5 h-3.5" />}
                              onClick={() => handleUpdateStatus(step, 'in_progress')}
                              loading={isUpdating}
                            >
                              Start Step
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* AI Rationale / Description */}
                      <p className="text-xs sm:text-[13px] text-[var(--text-tertiary)] leading-relaxed mb-4">
                        {step.ai_rationale || step.description}
                      </p>

                      {/* Quick Navigation Action Buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)]/60">
                        <button
                          onClick={() => navigate('/assessments')}
                          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--accent-light)] bg-[var(--bg-base)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-2.5 py-1.5 rounded-lg transition-colors font-medium"
                        >
                          <Code2 className="w-3.5 h-3.5 text-[var(--accent-light)]" />
                          Practice Challenges
                        </button>

                        <button
                          onClick={() => navigate('/mentor')}
                          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--accent-light)] bg-[var(--bg-base)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-2.5 py-1.5 rounded-lg transition-colors font-medium"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                          Consult AI Mentor
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default LearningRoadmap;
