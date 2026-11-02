import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import api from '../lib/api';
import Editor from '@monaco-editor/react';
import { 
  Brain, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Save, 
  ArrowLeft, 
  Layers, 
  Code2, 
  Award,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface VersionItem {
  id: number;
  version_num: number;
  quality_score?: number;
  summary_feedback?: string;
  created_at: string;
}

interface Project {
  id: number;
  name: string;
  title?: string;
  description: string;
  language: string;
  status: string;
  code?: string;
  versions?: VersionItem[];
  created_at: string;
  updated_at: string;
}

interface AnalysisResult {
  summary?: string;
  issues?: string[];
  suggestions?: string[];
  score?: number;
  version_num?: number;
}

export const ProjectEvolution: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showReview, setShowReview] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/projects/${id}/`);
        setProject(data);
        setCode(data.code || `# Project: ${data.name || data.title}\n\ndef main():\n    pass\n`);
        
        // If versions exist, set latest analysis
        if (data.versions && data.versions.length > 0) {
          const latest = data.versions[0];
          setAnalysis({
            summary: latest.summary_feedback,
            score: latest.quality_score,
            version_num: latest.version_num,
          });
        }
      } catch (err) {
        console.error('Failed to load project:', err);
        toast.error('Failed to load project details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  const saveCode = async () => {
    setSaving(true);
    try {
      await api.patch(`/projects/${id}/`, { code });
      toast.success('Code saved successfully.');
    } catch (err) {
      toast.error('Failed to save code.');
    } finally {
      setSaving(false);
    }
  };

  const analyzeCode = async () => {
    setAnalyzing(true);
    const toastId = toast.loading('AI is reviewing project architecture...');
    try {
      const { data } = await api.post(`/projects/${id}/analyze/`, { code });
      setAnalysis(data);
      toast.success(`Analysis complete! Quality score: ${data.score || 85}/100`, { id: toastId });
      
      // Refresh project to get updated version list
      const res = await api.get(`/projects/${id}/`);
      setProject(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Code analysis failed. Please try again.', { id: toastId });
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Loading Project..." subtitle="Retrieving workspace">
        <div className="max-w-4xl mx-auto py-10 space-y-4">
          <Skeleton lines={8} />
        </div>
      </AppLayout>
    );
  }

  const displayTitle = project?.name || project?.title || 'Project Workspace';
  const score = analysis?.score;

  return (
    <AppLayout
      title={displayTitle}
      subtitle={project?.description || 'Iterate code, run AI quality reviews, and track evolution'}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={() => navigate('/projects')}
          >
            Back
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<Save className="w-3.5 h-3.5" />}
            onClick={saveCode}
            loading={saving}
          >
            Save
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<History className="w-3.5 h-3.5" />}
            onClick={() => setShowHistory(!showHistory)}
          >
            Evolution ({project?.versions?.length || 0})
          </Button>

          <Button
            variant={showReview ? 'secondary' : 'ghost'}
            size="sm"
            icon={<Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />}
            onClick={() => setShowReview(!showReview)}
            title={showReview ? 'Hide AI Architecture Review' : 'Show AI Architecture Review'}
          >
            Review {analysis?.score ? `(${Math.round(analysis.score)}%)` : ''}
          </Button>

          <Button
            size="sm"
            icon={<Brain className="w-3.5 h-3.5 text-amber-300" />}
            onClick={analyzeCode}
            loading={analyzing}
          >
            Analyze Code
          </Button>
        </div>
      }
      fullHeight
    >
      <div className="flex h-full w-full overflow-hidden bg-[var(--bg-base)]">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden border-r border-[var(--border-subtle)]">
          {/* Editor Header Bar */}
          <div className="h-10 flex items-center justify-between px-4 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] shrink-0 text-xs">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[var(--accent-light)]" />
              <span className="font-semibold text-[var(--text-primary)]">main.{project?.language === 'javascript' ? 'js' : project?.language === 'typescript' ? 'ts' : 'py'}</span>
              <span className="text-[var(--text-quaternary)]">({project?.language || 'python'})</span>
            </div>

            <div className="flex items-center gap-2">
              {score !== undefined && score !== null && (
                <Badge variant={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger'}>
                  Quality Score: {Math.round(score)} / 100
                </Badge>
              )}
              {analysis?.version_num && (
                <span className="text-[11px] text-[var(--text-quaternary)]">
                  v{analysis.version_num}
                </span>
              )}
              {!showReview && (
                <button
                  onClick={() => setShowReview(true)}
                  className="flex items-center gap-1 text-[11px] text-[var(--accent-light)] hover:text-white px-2 py-0.5 rounded bg-[var(--accent-tint)] border border-[rgba(94,106,210,0.3)] transition-colors ml-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Open Review</span>
                </button>
              )}
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0 min-w-0 overflow-hidden relative">
            <Editor
              height="100%"
              language={project?.language || 'python'}
              value={code}
              onChange={(val) => setCode(val || '')}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false },
                padding: { top: 14, bottom: 14 },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                automaticLayout: true,
              }}
            />
          </div>
        </div>

        {/* Version History Drawer (Collapsible) */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-y-auto shrink-0 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[var(--accent-light)]" /> Version Timeline
                </h4>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-xs text-[var(--text-quaternary)] hover:text-[var(--text-primary)]"
                >
                  ✕
                </button>
              </div>

              {(!project?.versions || project.versions.length === 0) ? (
                <p className="text-xs text-[var(--text-quaternary)] py-4 text-center">
                  No versions saved yet. Run "Analyze Code" to generate version checkpoints.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {project.versions.map((ver) => (
                    <div
                      key={ver.id}
                      className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs"
                    >
                      <div className="flex items-center justify-between font-medium text-[var(--text-primary)] mb-1">
                        <span>Version {ver.version_num}</span>
                        {ver.quality_score !== undefined && (
                          <span className="text-[11px] text-[#4CB782]">★ {Math.round(ver.quality_score)}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--text-tertiary)] line-clamp-2 mb-1">
                        {ver.summary_feedback || 'No summary notes.'}
                      </p>
                      <span className="text-[10px] text-[var(--text-quaternary)]">
                        {new Date(ver.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Analysis Panel */}
        <AnimatePresence>
          {showReview && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-[340px] md:w-[360px] lg:w-[380px] xl:w-[400px] bg-[var(--bg-elevated)] border-l border-[var(--border-subtle)] flex flex-col h-full shrink-0 min-w-0 overflow-hidden"
            >
              <div className="p-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">AI Architecture Review</h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {analysis?.score !== undefined && analysis?.score !== null && (
                    <Badge variant="accent" className="font-semibold text-xs">
                      Score: {analysis.score}%
                    </Badge>
                  )}
                  <button
                    onClick={() => setShowReview(false)}
                    className="p-1 text-[var(--text-quaternary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)] rounded transition-colors text-xs cursor-pointer"
                    title="Close review panel"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                {!analysis ? (
                  <div className="py-16 text-center px-4">
                    <Brain className="w-8 h-8 text-[var(--text-quaternary)] mx-auto mb-3" />
                    <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-1">No Analysis Run Yet</h4>
                    <p className="text-xs text-[var(--text-tertiary)] leading-relaxed mb-4">
                      Click "Analyze Code" above to trigger a full code quality, bug detection, and architectural review.
                    </p>
                    <Button size="sm" onClick={analyzeCode} loading={analyzing} icon={<Sparkles className="w-3.5 h-3.5" />}>
                      Run First Review
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Summary Banner */}
                    {analysis.summary && (
                      <div className="bg-[var(--accent-tint)] border border-[rgba(94,106,210,0.25)] rounded-xl p-3.5 shadow-sm">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Info className="w-3.5 h-3.5 text-[var(--accent)]" />
                          <span className="text-xs font-semibold text-[var(--accent-light)]">Executive Summary</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                          {analysis.summary}
                        </p>
                      </div>
                    )}

                    {/* Detected Issues */}
                    {analysis.issues && analysis.issues.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs font-semibold text-[var(--text-primary)]">
                            Detected Issues & Blindspots ({analysis.issues.length})
                          </span>
                        </div>
                        <div className="space-y-2">
                          {analysis.issues.map((issue, idx) => (
                            <div
                              key={idx}
                              className="bg-[rgba(242,201,76,0.08)] border border-[rgba(242,201,76,0.2)] rounded-xl p-3 text-xs text-[var(--text-secondary)] leading-relaxed flex items-start gap-2"
                            >
                              <span className="text-amber-400 font-bold">•</span>
                              <span>{issue}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actionable Suggestions */}
                    {analysis.suggestions && analysis.suggestions.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#4CB782]" />
                          <span className="text-xs font-semibold text-[var(--text-primary)]">
                            Recommended Optimizations ({analysis.suggestions.length})
                          </span>
                        </div>
                        <div className="space-y-2">
                          {analysis.suggestions.map((sug, idx) => (
                            <div
                              key={idx}
                              className="bg-[rgba(76,183,130,0.08)] border border-[rgba(76,183,130,0.2)] rounded-xl p-3 text-xs text-[var(--text-secondary)] leading-relaxed flex items-start gap-2"
                            >
                              <span className="text-[#4CB782] font-bold">✓</span>
                              <span>{sug}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default ProjectEvolution;
