import React, { useEffect, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { 
  Settings as SettingsIcon, 
  User, 
  Bot, 
  Code2, 
  Activity, 
  Save, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles, 
  Server, 
  Download, 
  Terminal,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export const Settings: React.FC = () => {
  const { user, fetchUser } = useAuthStore();
  const [loading, setLoading] = useState(true);

  const [savingProfile, setSavingProfile] = useState(false);
  const [testingOllama, setTestingOllama] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<{ online: boolean; message: string } | null>(null);

  // Profile state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [level, setLevel] = useState('beginner');
  const [preferredLanguage, setPreferredLanguage] = useState('python');
  const [learningGoal, setLearningGoal] = useState('');

  // AI Mentor Preferences (synced with localStorage)
  const [defaultAgent, setDefaultAgent] = useState(() => localStorage.getItem('cs_default_agent') || 'professor');
  const [guidanceStyle, setGuidanceStyle] = useState(() => localStorage.getItem('cs_guidance_style') || 'balanced');

  // Editor Preferences (synced with localStorage)
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('cs_font_family') || 'JetBrains Mono');
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('cs_font_size')) || 13);
  const [tabSize, setTabSize] = useState(() => Number(localStorage.getItem('cs_tab_size')) || 4);
  const [minimap, setMinimap] = useState(() => localStorage.getItem('cs_minimap') === 'true');

  useEffect(() => {
    const fetchProfileAndHealth = async () => {
      try {
        setLoading(true);
        const [profileRes, healthRes] = await Promise.all([
          api.get('/auth/profile/'),
          api.get('/mentor/health/').catch(() => ({ data: { ollama_online: false, message: 'Could not connect.' } })),
        ]);

        const p = profileRes.data;
        setFirstName(p.first_name || '');
        setLastName(p.last_name || '');
        setEmail(p.email || '');
        setUsername(p.username || '');
        if (p.profile) {
          setLevel(p.profile.level || 'beginner');
          setPreferredLanguage(p.profile.preferred_language || 'python');
          setLearningGoal(p.profile.learning_goal || '');
        }

        setOllamaStatus({
          online: !!healthRes.data?.ollama_online,
          message: healthRes.data?.message || 'Checked',
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndHealth();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        profile: {
          level,
          preferred_language: preferredLanguage,
          learning_goal: learningGoal.trim(),
        },
      };

      await api.patch('/auth/profile/', payload);
      await fetchUser();
      toast.success('Profile preferences updated successfully!');

    } catch (err) {
      toast.error('Failed to save profile changes.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cs_default_agent', defaultAgent);
    localStorage.setItem('cs_guidance_style', guidanceStyle);
    localStorage.setItem('cs_font_family', fontFamily);
    localStorage.setItem('cs_font_size', String(fontSize));
    localStorage.setItem('cs_tab_size', String(tabSize));
    localStorage.setItem('cs_minimap', String(minimap));
    toast.success('Workspace & AI preferences saved.');
  };

  const checkOllamaHealth = async () => {
    setTestingOllama(true);
    try {
      const { data } = await api.get('/mentor/health/');
      setOllamaStatus({
        online: !!data.ollama_online,
        message: data.message,
      });
      if (data.ollama_online) {
        toast.success('Ollama LLM connection is healthy and responsive!');
      } else {
        toast.error('Ollama is offline. Start it with `ollama serve`.');
      }
    } catch (err) {
      setOllamaStatus({ online: false, message: 'Could not connect to Ollama server.' });
      toast.error('Could not connect to Ollama server.');
    } finally {
      setTestingOllama(false);
    }
  };

  const handleExportPortfolio = async () => {
    try {
      const [profileRes, analyticsRes] = await Promise.all([
        api.get('/auth/profile/'),
        api.get('/learning/progress/analytics/'),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        profile: profileRes.data,
        analytics: analyticsRes.data,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `codesensei_portfolio_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Portfolio data exported successfully.');
    } catch (err) {
      toast.error('Failed to export portfolio data.');
    }
  };

  return (
    <AppLayout
      title="Settings & Preferences"
      subtitle="Configure your student profile, AI mentor personas, editor defaults, and diagnostics"
    >
      {loading ? (
        <div className="max-w-4xl mx-auto space-y-6 mt-4">
          <div className="h-48 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl animate-pulse" />
          <div className="h-48 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl animate-pulse" />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto py-2 space-y-6">
          {/* Section 1: Student Profile */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--border-subtle)]">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-tint)] border border-[var(--accent)] flex items-center justify-center text-[var(--accent-light)]">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">Student Profile</h3>
                <p className="text-xs text-[var(--text-tertiary)]">Your identity, experience level, and learning ambitions</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Jane"
                    className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Doe"
                    className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full h-10 px-3 bg-[var(--bg-base)]/50 border border-[var(--border-subtle)] rounded-xl text-xs sm:text-sm text-[var(--text-quaternary)] cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Username</label>
                  <input
                    type="text"
                    value={username}
                    disabled
                    className="w-full h-10 px-3 bg-[var(--bg-base)]/50 border border-[var(--border-subtle)] rounded-xl text-xs sm:text-sm text-[var(--text-quaternary)] cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Experience Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="beginner">Beginner (Building syntax intuition)</option>
                    <option value="intermediate">Intermediate (Comfortable with OOP & DS)</option>
                    <option value="advanced">Advanced (Algorithms & System Design)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Primary Language</label>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="python">Python 3</option>
                    <option value="javascript">JavaScript (Node.js)</option>
                    <option value="typescript">TypeScript</option>
                    <option value="go">Go</option>
                    <option value="java">Java</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Learning Goal</label>
                <textarea
                  value={learningGoal}
                  onChange={(e) => setLearningGoal(e.target.value)}
                  placeholder="e.g. Master algorithms and build scalable backend systems..."
                  rows={2}
                  className="w-full p-3 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-quaternary)] focus:outline-none focus:border-[var(--accent)] resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button size="sm" type="submit" loading={savingProfile} icon={<Save className="w-3.5 h-3.5" />}>
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </motion.div>

          {/* Section 2: AI Mentor Personas & Guidance Tuning */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--border-subtle)]">
              <div className="w-8 h-8 rounded-lg bg-[rgba(76,183,130,0.12)] border border-[rgba(76,183,130,0.25)] flex items-center justify-center text-[#4CB782]">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">AI Mentor & Pedagogical Style</h3>
                <p className="text-xs text-[var(--text-tertiary)]">Customize your default mentor personality and inquiry mode</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Default Mentor Persona</label>
                <select
                  value={defaultAgent}
                  onChange={(e) => setDefaultAgent(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="professor">🎓 Professor Turing — First Principles & Theory</option>
                  <option value="senior_engineer">⚡ Ada Lovelace — Architecture & Clean Code</option>
                  <option value="debug_specialist">🐞 Linus Debugger — Root Cause & Edge Cases</option>
                  <option value="interviewer">💼 Grace Interviewer — FAANG Coding Interview Drills</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Socratic Guidance Strictness</label>
                <select
                  value={guidanceStyle}
                  onChange={(e) => setGuidanceStyle(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="balanced">Balanced — Hints & Code Snippets</option>
                  <option value="strict_socratic">Strict Socratic — Questions only, no direct solutions</option>
                  <option value="comprehensive">Comprehensive — In-depth walkthroughs & solutions</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button size="sm" variant="secondary" onClick={handleSavePreferences} icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                Save AI Preferences
              </Button>
            </div>
          </motion.div>

          {/* Section 3: Monaco Code Editor Defaults */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--border-subtle)]">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">Code Workspace & Editor</h3>
                <p className="text-xs text-[var(--text-tertiary)]">Font, layout, and indentation options for coding environments</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Font Family</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="JetBrains Mono">JetBrains Mono</option>
                  <option value="Fira Code">Fira Code</option>
                  <option value="Source Code Pro">Source Code Pro</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Font Size</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value={12}>12 px</option>
                  <option value={13}>13 px (Default)</option>
                  <option value={14}>14 px</option>
                  <option value={16}>16 px</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Tab Indentation</label>
                <select
                  value={tabSize}
                  onChange={(e) => setTabSize(Number(e.target.value))}
                  className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value={2}>2 Spaces</option>
                  <option value={4}>4 Spaces (Python)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Code Minimap</label>
                <select
                  value={minimap ? 'true' : 'false'}
                  onChange={(e) => setMinimap(e.target.value === 'true')}
                  className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="false">Disabled</option>
                  <option value="true">Enabled</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button size="sm" variant="secondary" onClick={handleSavePreferences} icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                Save Editor Defaults
              </Button>
            </div>
          </motion.div>

          {/* Section 4: Diagnostics, AI Health & Portfolio Export */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--border-subtle)]">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-[#4CB782]">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">System Health & Telemetry</h3>
                <p className="text-xs text-[var(--text-tertiary)]">Local inference status, connected database, and data portability</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <span className="text-xs text-[var(--text-tertiary)] block">Ollama LLM Engine</span>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">llama3:latest</span>
                </div>
                <Badge variant={ollamaStatus?.online ? 'success' : 'danger'}>
                  {ollamaStatus?.online ? 'Online' : 'Offline'}
                </Badge>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <span className="text-xs text-[var(--text-tertiary)] block">Database</span>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">SQLite (Active)</span>
                </div>
                <Badge variant="success">Connected</Badge>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <span className="text-xs text-[var(--text-tertiary)] block">API Server</span>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">Django REST</span>
                </div>
                <Badge variant="success">8000 OK</Badge>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
              <Button
                variant="secondary"
                size="sm"
                onClick={checkOllamaHealth}
                loading={testingOllama}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${testingOllama ? 'animate-spin' : ''}`} />}
              >
                Ping Ollama Service
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportPortfolio}
                icon={<Download className="w-3.5 h-3.5" />}
              >
                Export Learning Portfolio (JSON)
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AppLayout>
  );
};

export default Settings;
