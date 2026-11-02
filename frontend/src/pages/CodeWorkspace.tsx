import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import api from '../lib/api';
import Editor from '@monaco-editor/react';
import { Play, CheckCircle2, XCircle, AlertTriangle, ArrowLeft, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface TestCaseResult {
  test_case: number;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
}

interface Problem {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  concept_name: string;
  examples?: string;
  constraints?: string;
  starter_code?: string;
  test_cases?: Array<{ id: number; input_data: string; expected_output: string }>;
}

interface SubmissionResult {
  status: string;
  feedback: string;
  passed?: boolean;
  results?: TestCaseResult[];
  mastery_state?: string;
  mastery_score?: number;
}

const DIFF_VARIANTS: Record<string, 'success' | 'warning' | 'danger'> = {
  easy: 'success',
  medium: 'warning',
  hard: 'danger',
};

const CodeWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('# Write your solution here\n');
  const [language, setLanguage] = useState('python');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'examples' | 'testcases'>('description');

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/assessments/problems/${id}/`);
        setProblem(data);
        if (data.starter_code) {
          setCode(data.starter_code);
        }
      } catch (err) {
        console.error('Failed to fetch problem', err);
        toast.error('Failed to load assessment problem.');
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [id]);

  const handleRunCode = async () => {
    setRunning(true);
    setResult(null);
    try {
      const { data } = await api.post(`/assessments/problems/${id}/run/`, { code, language });
      setResult(data);
      if (data.passed) {
        toast.success('Test run passed! Ready for submission.');
      } else {
        toast.error(data.error_message || 'Some test cases did not pass.');
      }
    } catch (err: any) {
      setResult({
        status: 'error',
        feedback: err.response?.data?.error || 'Execution failed.',
      });
      toast.error('Execution encountered an error.');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      const { data } = await api.post(`/assessments/problems/${id}/submit/`, { code, language });
      setResult(data);
      if (data.passed) {
        toast.success(`Accepted! Mastery updated to ${data.mastery_score}%`);
      } else {
        toast.error('Submission failed some test cases. Try again!');
      }
    } catch (err: any) {
      setResult({
        status: 'error',
        feedback: err.response?.data?.error || 'Submission failed.',
      });
      toast.error('Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { key: 'description', label: 'Description' },
    { key: 'examples', label: 'Examples' },
    { key: 'testcases', label: 'Sample Test Cases' },
  ] as const;

  return (
    <AppLayout
      title={problem?.title || 'Code Workspace'}
      subtitle={problem ? `${problem.concept_name} • ${problem.difficulty.toUpperCase()}` : 'Problem Solving'}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={() => navigate('/assessments')}
          >
            All Problems
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Bot className="w-3.5 h-3.5 text-sky-400" />}
            onClick={() => navigate(`/mentor?topic=${encodeURIComponent(problem?.concept_name || '')}`)}
          >
            Ask AI Mentor
          </Button>
        </div>
      }
      fullHeight
    >
      <div className="flex h-full">
        {/* Left panel — problem description and tests */}
        <div className="w-[45%] shrink-0 border-r border-[var(--border-default)] flex flex-col overflow-hidden bg-[var(--bg-panel)]">
          {/* Tabs */}
          <div className="h-10 flex items-center border-b border-[var(--border-default)] px-4 gap-4 shrink-0 bg-[var(--bg-elevated)]">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`text-[13px] font-medium pb-2.5 pt-2.5 border-b-2 transition-colors ${
                  activeTab === t.key
                    ? 'text-[var(--text-primary)] border-[var(--accent)]'
                    : 'text-[var(--text-tertiary)] border-transparent hover:text-[var(--text-primary)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <Skeleton lines={6} />
            ) : problem ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">{problem.title}</h2>
                  <Badge variant={DIFF_VARIANTS[problem.difficulty] || 'neutral'}>
                    {problem.difficulty.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-[var(--text-quaternary)]">• {problem.concept_name}</span>
                </div>

                {activeTab === 'description' && (
                  <div className="text-[14px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                    {problem.description}
                  </div>
                )}

                {activeTab === 'examples' && (
                  <div className="space-y-3">
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Observe how the function should behave with the following inputs:
                    </p>
                    {problem.test_cases && problem.test_cases.length > 0 ? (
                      problem.test_cases.map((tc, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs font-mono space-y-1">
                          <div className="text-[var(--text-secondary)]"><span className="text-[var(--text-quaternary)]">Input: </span>{tc.input_data}</div>
                          <div className="text-[#4CB782]"><span className="text-[var(--text-quaternary)]">Output: </span>{tc.expected_output}</div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[var(--text-quaternary)] text-xs">No explicit examples listed.</p>
                    )}
                  </div>
                )}

                {activeTab === 'testcases' && (
                  <div className="space-y-2">
                    <p className="text-xs text-[var(--text-tertiary)] mb-2">
                      Non-hidden verification cases executed upon test:
                    </p>
                    {problem.test_cases?.map((tc, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs font-mono">
                        <span className="text-[var(--text-tertiary)]">Case {idx + 1}: </span>
                        <code className="text-[var(--accent-light)]">{tc.input_data}</code>
                        <span className="text-[var(--text-quaternary)]"> → </span>
                        <code className="text-[#4CB782]">{tc.expected_output}</code>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>

        {/* Right panel — editor & test console */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-base)]">
          {/* Editor toolbar */}
          <div className="h-10 flex items-center justify-between px-4 border-b border-[var(--border-default)] shrink-0 bg-[var(--bg-elevated)]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-tertiary)] font-medium">Language:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="h-7 px-2.5 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-md text-[12px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="python">Python 3</option>
              </select>
            </div>
          </div>

          {/* Monaco editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(val) => setCode(val || '')}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false },
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                scrollBeyondLastLine: false,
                padding: { top: 12 },
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
              }}
            />
          </div>

          {/* Result panel */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-[var(--border-default)] bg-[var(--bg-elevated)] overflow-hidden max-h-56 overflow-y-auto"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.status === 'accepted' || result.passed ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[#4CB782]" />
                          <span className="text-sm font-semibold text-[#4CB782]">Accepted</span>
                        </>
                      ) : result.status === 'error' ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-[#F2C94C]" />
                          <span className="text-sm font-semibold text-[#F2C94C]">Runtime Error</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-[#EB5757]" />
                          <span className="text-sm font-semibold text-[#EB5757]">Wrong Answer</span>
                        </>
                      )}
                    </div>

                    {result.mastery_score !== undefined && (
                      <Badge variant="accent">
                        Mastery: {result.mastery_score}% ({result.mastery_state})
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                    {result.feedback}
                  </p>

                  {/* Individual Test Case Results */}
                  {result.results && result.results.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {result.results.map((r, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded-lg text-xs font-mono flex items-center justify-between border ${
                            r.passed
                              ? 'bg-[rgba(76,183,130,0.08)] border-[rgba(76,183,130,0.25)] text-[#4CB782]'
                              : 'bg-[rgba(235,87,87,0.08)] border-[rgba(235,87,87,0.25)] text-[#EB5757]'
                          }`}
                        >
                          <div>
                            <span className="font-semibold">Case {r.test_case}: </span>
                            <code>{r.input}</code>
                          </div>
                          <div>
                            <span>Exp: {r.expected}</span>
                            <span className="ml-2">Got: {r.actual}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom bar */}
          <div className="h-12 px-4 flex items-center justify-end gap-2 border-t border-[var(--border-default)] bg-[var(--bg-panel)] shrink-0">
            <Button
              variant="secondary"
              size="sm"
              icon={<Play className="w-3.5 h-3.5 text-[#4CB782]" />}
              onClick={handleRunCode}
              loading={running}
            >
              Run Code
            </Button>
            <Button
              size="sm"
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              onClick={handleSubmit}
              loading={submitting}
            >
              Submit Solution
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CodeWorkspace;
