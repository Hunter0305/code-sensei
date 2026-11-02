import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SkeletonCard } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import api from '../lib/api';
import { 
  Plus, 
  FolderOpen, 
  X, 
  Code2, 
  Layers, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  Terminal, 
  FileCode,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Project {
  id: number;
  name: string;
  title?: string;
  description: string;
  language: string;
  status: string;
  code?: string;
  version_count?: number;
  latest_version?: {
    quality_score?: number;
    summary_feedback?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

const LANG_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  python: { label: 'Python', color: '#4EA7FC', icon: '🐍' },
  javascript: { label: 'JavaScript', color: '#F2C94C', icon: '🟨' },
  typescript: { label: 'TypeScript', color: '#3178C6', icon: '🔷' },
  java: { label: 'Java', color: '#EB5757', icon: '☕' },
  go: { label: 'Go', color: '#4CB782', icon: '🐹' },
};

const PROJECT_TEMPLATES = [
  {
    title: 'Python CLI Utility',
    desc: 'Command-line tool with argument parsing and structured output.',
    language: 'python',
    starterCode: `import sys\nimport argparse\n\ndef main():\n    parser = argparse.ArgumentParser(description="Sample CLI Tool")\n    parser.add_argument("--name", help="User name", default="Sensei")\n    args = parser.parse_args()\n    print(f"Hello, {args.name}!")\n\nif __name__ == "__main__":\n    main()\n`,
  },
  {
    title: 'Data Structure & Algorithm Suite',
    desc: 'Implement and benchmark custom algorithms with test fixtures.',
    language: 'python',
    starterCode: `class LRUCache:\n    def __init__(self, capacity: int):\n        self.capacity = capacity\n        self.cache = {}\n\n    def get(self, key: int) -> int:\n        return self.cache.get(key, -1)\n\n    def put(self, key: int, value: int) -> None:\n        self.cache[key] = value\n`,
  },
  {
    title: 'REST API Service',
    desc: 'Lightweight web service handling JSON requests and validation.',
    language: 'python',
    starterCode: `from http.server import HTTPServer, BaseHTTPRequestHandler\nimport json\n\nclass SimpleHandler(BaseHTTPRequestHandler):\n    def do_GET(self):\n        self.send_response(200)\n        self.send_header('Content-Type', 'application/json')\n        self.end_headers()\n        response = {"status": "ok", "message": "API live"}\n        self.wfile.write(json.dumps(response).encode())\n`,
  },
];

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', language: 'python', code: '' });
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects/');
      const list = Array.isArray(data) ? data : data.results || [];
      setProjects(list);
    } catch (err) {
      console.error('Failed to load projects:', err);
      toast.error('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const createProject = async () => {
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      toast.error('Please enter a project name.');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        name: trimmedTitle,
        title: trimmedTitle,
        description: form.description.trim(),
        language: form.language,
        code: form.code || `# Project: ${trimmedTitle}\n# Language: ${form.language}\n\ndef main():\n    print("Welcome to ${trimmedTitle}")\n\nif __name__ == "__main__":\n    main()\n`,
      };

      const { data } = await api.post('/projects/', payload);
      setProjects((p) => [data, ...p]);
      setShowModal(false);
      setForm({ title: '', description: '', language: 'python', code: '' });
      toast.success(`Project "${data.name || data.title}" created!`);
    } catch (err: any) {
      console.error('Create project failed:', err);
      const msg = err.response?.data?.name?.[0] || err.response?.data?.title?.[0] || 'Failed to create project.';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const deleteProject = async (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    setDeletingId(id);
    try {
      await api.delete(`/projects/${id}/`);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success(`Deleted "${name}".`);
    } catch (err) {
      toast.error('Failed to delete project.');
    } finally {
      setDeletingId(null);
    }
  };

  const applyTemplate = (tmpl: typeof PROJECT_TEMPLATES[0]) => {
    setForm({
      title: tmpl.title,
      description: tmpl.desc,
      language: tmpl.language,
      code: tmpl.starterCode,
    });
  };

  return (
    <AppLayout
      title="Software Projects"
      subtitle="Architect, analyze, and evolve your custom code projects with AI code reviews"
      actions={
        <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowModal(true)}>
          New Project
        </Button>
      }
    >
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="w-8 h-8 text-[var(--accent)]" />}
          title="No projects created yet"
          description="Create your first project to start tracking code evolution and receiving AI architecture reviews."
          action={
            <Button icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowModal(true)}>
              Create Your First Project
            </Button>
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          {projects.map((p, i) => {
            const langInfo = LANG_CONFIG[p.language?.toLowerCase()] || {
              label: p.language || 'Python',
              color: '#4EA7FC',
              icon: '📄',
            };
            const displayTitle = p.name || p.title || 'Untitled Project';
            const score = p.latest_version?.quality_score;

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="group relative bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--accent)] rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Badges & Actions */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] font-medium">
                      <span>{langInfo.icon}</span>
                      <span>{langInfo.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {score !== undefined && score !== null && (
                        <Badge variant={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger'}>
                          ★ {Math.round(score)} / 100
                        </Badge>
                      )}
                      <button
                        onClick={(e) => deleteProject(e, p.id, displayTitle)}
                        disabled={deletingId === p.id}
                        className="opacity-0 group-hover:opacity-100 text-[var(--text-quaternary)] hover:text-red-400 p-1 rounded transition-opacity"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-light)] transition-colors mb-1.5 flex items-center justify-between">
                    <span className="truncate">{displayTitle}</span>
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[var(--accent-light)] shrink-0 ml-2" />
                  </h3>
                  <p className="text-xs text-[var(--text-tertiary)] line-clamp-2 leading-relaxed mb-4">
                    {p.description || 'No description provided.'}
                  </p>
                </div>

                {/* Footer Metadata */}
                <div className="pt-3 border-t border-[var(--border-subtle)]/70 flex items-center justify-between text-[11px] text-[var(--text-quaternary)]">
                  <div className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[var(--text-tertiary)]" />
                    <span>{p.version_count || 1} {p.version_count === 1 ? 'version' : 'versions'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(p.updated_at || p.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <AnimatePresence>
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-tint)] border border-[var(--accent)] flex items-center justify-center text-[var(--accent-light)]">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[var(--text-primary)]">Create New Project</h2>
                    <p className="text-xs text-[var(--text-tertiary)]">Configure your workspace and start coding.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-[var(--text-quaternary)] hover:text-[var(--text-primary)] text-sm px-2 py-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Starter Templates */}
              <div className="mb-4">
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">
                  Quick Starter Templates:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PROJECT_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyTemplate(tmpl)}
                      className="p-2.5 text-left rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] hover:border-[var(--accent)] hover:bg-[var(--bg-surface)] transition-all group"
                    >
                      <div className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-light)] truncate">
                        {tmpl.title}
                      </div>
                      <div className="text-[10px] text-[var(--text-tertiary)] line-clamp-1 mt-0.5">
                        {tmpl.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                    Project Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Memory Cache Manager"
                    className="w-full h-10 px-3.5 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-quaternary)] focus:outline-none focus:border-[var(--accent)]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && form.title.trim()) createProject();
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Brief summary of what this project does and architecture goals..."
                    rows={2}
                    className="w-full p-3 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-quaternary)] focus:outline-none focus:border-[var(--accent)] resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                    Primary Language
                  </label>
                  <select
                    value={form.language}
                    onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}
                    className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="java">Java</option>
                    <option value="go">Go</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button variant="ghost" className="flex-1" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={createProject}
                  loading={creating}
                  disabled={!form.title.trim()}
                >
                  Create Project
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
};

export default Projects;
