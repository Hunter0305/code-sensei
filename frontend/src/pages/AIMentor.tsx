import React, { useEffect, useState, useRef } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import api from '../lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Plus, Search, Trash2, ArrowUp, Users, Database, Sparkles, CheckCircle2, MessageSquare, ShieldCheck, Copy, Check, Code, Paperclip, FileCode, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Agent {
  id: string;
  name: string;
  emoji: string;
  title: string;
  specialty: string;
  description: string;
  color?: string;
  accent?: string;
}

interface Conversation {
  id: number;
  agent_id: string;
  agent_name?: string;
  agent_emoji?: string;
  agent_info?: Agent;
  topic: string;
  created_at: string;
}

interface Message {
  id: number;
  role: string;
  content: string;
  created_at: string;
}

interface FacultyNote {
  id: number;
  author_agent: string;
  author_name: string;
  author_emoji: string;
  target_agent?: string;
  topic?: string;
  note_type: 'observation' | 'recommendation' | 'praise' | 'alert';
  content: string;
  created_at: string;
}

interface StudentSummary {
  greeting?: string;
  streak: number;
  total_xp: number;
  level: string;
  overall_mastery?: number;
}

const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'professor',
    name: 'Professor',
    emoji: '🎓',
    title: 'Conceptual Mentor',
    specialty: 'Concepts & Fundamentals',
    description: 'A patient, Socratic teacher who explains programming theory using real-world analogies without giving direct answers.',
    color: 'purple',
    accent: '#7C3AED',
  },
  {
    id: 'senior_engineer',
    name: 'Senior Engineer',
    emoji: '👨‍💻',
    title: 'Code Quality Mentor',
    specialty: 'Code Quality & Architecture',
    description: 'A 10-year industry veteran who reviews code for clean architecture, SOLID principles, performance, and best practices.',
    color: 'blue',
    accent: '#3B82F6',
  },
  {
    id: 'debug_specialist',
    name: 'Debug Specialist',
    emoji: '🔍',
    title: 'Bug Hunting Mentor',
    specialty: 'Debugging & Root Cause',
    description: 'A methodical bug hunter who guides you step-by-step through tracebacks, state inspection, and systematic troubleshooting.',
    color: 'red',
    accent: '#EF4444',
  },
  {
    id: 'interviewer',
    name: 'Interviewer',
    emoji: '🎯',
    title: 'Technical Interview Coach',
    specialty: 'DSA & Mock Interviews',
    description: 'A FAANG-style interviewer conducting structured mock interviews with complexity analysis, edge cases, and actionable feedback.',
    color: 'green',
    accent: '#22C55E',
  },
];

const BADGE_COLOR_MAP: Record<string, 'accent' | 'info' | 'danger' | 'success'> = {
  professor: 'accent',
  senior_engineer: 'info',
  debug_specialist: 'danger',
  interviewer: 'success',
};

const NOTE_BADGE_MAP: Record<string, { variant: 'accent' | 'info' | 'danger' | 'success' | 'warning'; label: string }> = {
  observation: { variant: 'info', label: 'Observation' },
  recommendation: { variant: 'accent', label: 'Cross-Referral' },
  praise: { variant: 'success', label: 'Strength' },
  alert: { variant: 'danger', label: 'Needs Focus' },
};

const extractRawText = (node: React.ReactNode): string => {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(extractRawText).join('');
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return extractRawText(props.children);
  }
  return '';
};

const CodeBlock: React.FC<React.HTMLAttributes<HTMLPreElement>> = ({ children }) => {
  const [copied, setCopied] = useState(false);

  let language = 'code';
  let rawCode = '';

  if (React.isValidElement(children)) {
    const childProps = children.props as { className?: string; children?: React.ReactNode };
    const langMatch = /language-([a-zA-Z0-9_-]+)/.exec(childProps.className || '');
    if (langMatch) {
      language = langMatch[1];
    }
    rawCode = extractRawText(childProps.children);
  } else {
    rawCode = extractRawText(children);
  }
  rawCode = rawCode.replace(/\n$/, '');

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(rawCode);
      setCopied(true);
      toast.success(`${language.toUpperCase()} code copied to clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = rawCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      toast.success(`${language.toUpperCase()} code copied to clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="code-block-container relative group my-3 rounded-xl border border-[var(--border-default)] overflow-hidden bg-[#0D1117] shadow-md">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#161B22] border-b border-[#30363D] select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 opacity-75">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
          </div>
          <span className="font-mono text-[11px] font-semibold text-[#8B949E] uppercase tracking-wider ml-1">
            {language}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] text-[#C9D1D9] hover:text-white transition-all duration-150 border border-[rgba(255,255,255,0.08)] cursor-pointer active:scale-95"
          title="Copy code snippet"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#3FB950]" />
              <span className="text-[#3FB950] font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[#8B949E]" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <pre className="!bg-transparent !border-0 !p-4 !m-0 !rounded-none overflow-x-auto text-[13px] font-mono leading-relaxed text-[#E6EDF3]">
        {children}
      </pre>
    </div>
  );
};

const hasCodeBlock = (text: string) => /```[\s\S]*?```/.test(text);

const extractCodeFromMarkdown = (markdown: string): string => {
  const matches: string[] = [];
  const regex = /```(?:\w+)?\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    matches.push(match[1].trim());
  }
  return matches.length > 0 ? matches.join('\n\n') : markdown;
};

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  py: 'python',
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  java: 'java',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  c: 'c',
  h: 'c',
  hpp: 'cpp',
  cs: 'csharp',
  go: 'go',
  rs: 'rust',
  rb: 'ruby',
  php: 'php',
  html: 'html',
  css: 'css',
  json: 'json',
  sql: 'sql',
  sh: 'bash',
  txt: 'plaintext',
  md: 'markdown',
};

const detectLanguage = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return EXTENSION_LANGUAGE_MAP[ext] || 'python';
};

interface AttachedFile {
  name: string;
  size: number;
  content: string;
  language: string;
  lineCount: number;
}

const AIMentor: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [facultyNotes, setFacultyNotes] = useState<FacultyNote[]>([]);
  const [studentSummary, setStudentSummary] = useState<StudentSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'faculty'>('chat');
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [hintLevel, setHintLevel] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [newConvData, setNewConvData] = useState({ agent_id: 'professor', topic: '', language: 'python' });
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [copiedCodeMessageId, setCopiedCodeMessageId] = useState<number | null>(null);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size exceeds 2MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      const lines = content.split('\n').length;
      const lang = detectLanguage(file.name);

      setAttachedFile({
        name: file.name,
        size: file.size,
        content,
        language: lang,
        lineCount: lines,
      });

      toast.success(`Attached "${file.name}" (${lines} lines)`);

      // Auto-suggest message prompt if input is currently empty
      if (!input.trim()) {
        if (activeConv?.agent_id === 'debug_specialist') {
          setInput(`Please debug this file (${file.name}). Identify any syntax errors, logic bugs, or edge-case failures, and provide the corrected code.`);
        } else {
          setInput(`Please review this code from ${file.name} and provide guidance.`);
        }
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read file contents.');
    };

    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleModalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      const lang = detectLanguage(file.name);

      setNewConvData((prev) => ({
        ...prev,
        topic: prev.topic || `Debugging ${file.name}`,
        language: lang,
      }));

      setAttachedFile({
        name: file.name,
        size: file.size,
        content,
        language: lang,
        lineCount: content.split('\n').length,
      });

      toast.success(`Attached "${file.name}" to conversation!`);
    };
    reader.readAsText(file);
    if (modalFileInputRef.current) modalFileInputRef.current.value = '';
  };

  const handleCopyAnswer = async (id: number, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(id);
      toast.success('Answer copied to clipboard!');
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedMessageId(id);
      toast.success('Answer copied to clipboard!');
      setTimeout(() => setCopiedMessageId(null), 2000);
    }
  };

  const handleCopyCodeOnly = async (id: number, content: string) => {
    const code = extractCodeFromMarkdown(content);
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeMessageId(id);
      toast.success('Solution code copied to clipboard!');
      setTimeout(() => setCopiedCodeMessageId(null), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedCodeMessageId(id);
      toast.success('Solution code copied to clipboard!');
      setTimeout(() => setCopiedCodeMessageId(null), 2000);
    }
  };

  const getAgentEmoji = (conv?: Conversation | null) =>
    conv?.agent_emoji || conv?.agent_info?.emoji || DEFAULT_AGENTS.find((a) => a.id === conv?.agent_id)?.emoji || '🤖';

  const getAgentName = (conv?: Conversation | null) =>
    conv?.agent_name || conv?.agent_info?.name || DEFAULT_AGENTS.find((a) => a.id === conv?.agent_id)?.name || 'Mentor';

  const fetchFacultyNotes = async () => {
    try {
      const res = await api.get('/mentor/faculty-notes/');
      const raw = res.data;
      setFacultyNotes(raw?.results || (Array.isArray(raw) ? raw : []));
    } catch {
      /* ignore */
    }
  };

  const fetchStudentSummary = async () => {
    try {
      const res = await api.get('/auth/dashboard/');
      setStudentSummary(res.data);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agentRes, convRes, notesRes, summaryRes] = await Promise.allSettled([
          api.get('/mentor/agents/'),
          api.get('/mentor/conversations/'),
          api.get('/mentor/faculty-notes/'),
          api.get('/auth/dashboard/'),
        ]);

        if (agentRes.status === 'fulfilled') {
          const raw = agentRes.value.data;
          const loaded = raw?.agents || raw?.results || (Array.isArray(raw) ? raw : []);
          if (Array.isArray(loaded) && loaded.length > 0) {
            setAgents(loaded);
          }
        }

        if (convRes.status === 'fulfilled') {
          const rawConv = convRes.value.data;
          setConversations(rawConv?.results || (Array.isArray(rawConv) ? rawConv : []));
        }

        if (notesRes.status === 'fulfilled') {
          const rawNotes = notesRes.value.data;
          setFacultyNotes(rawNotes?.results || (Array.isArray(rawNotes) ? rawNotes : []));
        }

        if (summaryRes.status === 'fulfilled') {
          setStudentSummary(summaryRes.value.data);
        }
      } catch (err) {
        console.error('Mentor load error', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText]);

  const loadConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    setActiveTab('chat');
    try {
      const { data } = await api.get(`/mentor/conversations/${conv.id}/`);
      setMessages(data.messages || []);
      setHintLevel(data.hint_level || 1);
    } catch (err) {
      console.error(err);
    }
  };

  const createConversation = async () => {
    if (!newConvData.agent_id || !newConvData.topic.trim()) return;
    try {
      const { data } = await api.post('/mentor/conversations/', newConvData);
      setConversations((p) => [data, ...p]);
      setActiveConv(data);
      setActiveTab('chat');
      setMessages([]);
      setShowNewModal(false);
      setNewConvData({ agent_id: 'professor', topic: '', language: 'python' });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/mentor/conversations/${id}/`);
      setConversations((p) => p.filter((c) => c.id !== id));
      if (activeConv?.id === id) {
        setActiveConv(null);
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !attachedFile) || !activeConv || streaming) return;

    let userDisplayContent = input.trim();
    let requestContent = input.trim();
    let codeContext = '';

    if (attachedFile) {
      codeContext = attachedFile.content;
      const fileHeader = `📁 **Attached File:** \`${attachedFile.name}\` (${attachedFile.language})\n\n\`\`\`${attachedFile.language}\n${attachedFile.content}\n\`\`\``;

      if (userDisplayContent) {
        requestContent = `${userDisplayContent}\n\n${fileHeader}`;
        userDisplayContent = `${userDisplayContent}\n\n${fileHeader}`;
      } else {
        const defaultPrompt = activeConv.agent_id === 'debug_specialist'
          ? `Please debug and analyze the attached file \`${attachedFile.name}\`. Identify any bugs and provide corrected code.`
          : `Please review and explain the attached file \`${attachedFile.name}\`.`;
        requestContent = `${defaultPrompt}\n\n${fileHeader}`;
        userDisplayContent = `${defaultPrompt}\n\n${fileHeader}`;
      }
    }

    const userMsg: Message = { id: Date.now(), role: 'user', content: userDisplayContent, created_at: new Date().toISOString() };
    setMessages((p) => [...p, userMsg]);
    setInput('');
    setAttachedFile(null);
    setStreaming(true);
    setStreamText('');

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/mentor/conversations/${activeConv.id}/message/?stream=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: requestContent, code_context: codeContext }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed === 'data: [DONE]') continue;
            if (trimmed.startsWith('data: ')) {
              try {
                const payload = JSON.parse(trimmed.slice(6));
                const chunk = payload.chunk || payload.content || '';
                fullText += chunk;
                setStreamText(fullText);
              } catch {
                fullText += trimmed.slice(6);
                setStreamText(fullText);
              }
            }
          }
        }
      }

      setMessages((p) => [...p, { id: Date.now() + 1, role: 'assistant', content: fullText, created_at: new Date().toISOString() }]);

      // Refresh faculty notes & student progress in background
      setTimeout(() => {
        fetchFacultyNotes();
        fetchStudentSummary();
      }, 1000);
    } catch (err) {
      console.error('Stream error', err);
    } finally {
      setStreaming(false);
      setStreamText('');
    }
  };

  const changeHintLevel = async (newLevel?: number) => {
    if (!activeConv) return;
    try {
      const payload = newLevel ? { hint_level: newLevel } : {};
      const { data } = await api.post(`/mentor/conversations/${activeConv.id}/hint/`, payload);
      const lvl = data.hint_level || newLevel || hintLevel + 1;
      setHintLevel(lvl);
      toast.info(data.message || `Hint level updated to ${lvl}/5`);
      if (data.hint_prompt && !inputText.trim()) {
        setInputText(data.hint_prompt);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update hint level.');
    }
  };

  const escalateHint = () => changeHintLevel();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredConvs = conversations.filter((c) =>
    !searchQuery || c.topic?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const timeAgo = (d: string) => {
    const diff = (Date.now() - new Date(d).getTime()) / 1000;
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <AppLayout title="AI Mentor" subtitle="Personalized guidance from specialized mentors" fullHeight>
      <div className="flex h-full">
        {/* Conversation sidebar */}
        <div className="w-[280px] shrink-0 bg-[var(--bg-panel)] border-r border-[var(--border-default)] flex flex-col">
          <div className="p-3 space-y-2 border-b border-[var(--border-subtle)]">
            <Button
              className="w-full"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setNewConvData((p) => ({ ...p, agent_id: p.agent_id || 'professor' }));
                setShowNewModal(true);
              }}
            >
              New Conversation
            </Button>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-quaternary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full h-8 pl-8 pr-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-md text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-quaternary)] focus:outline-none"
              />
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="px-3 pt-2 pb-1 flex gap-1 border-b border-[var(--border-subtle)]">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-1.5 px-2 rounded-md text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'chat'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chats
            </button>
            <button
              onClick={() => setActiveTab('faculty')}
              className={`flex-1 py-1.5 px-2 rounded-md text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'faculty'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Faculty Board
              {facultyNotes.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[var(--accent)] text-white text-[10px] flex items-center justify-center">
                  {facultyNotes.length}
                </span>
              )}
            </button>
          </div>

          {/* Sidebar Chat List */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-2 py-2">
            {filteredConvs.length === 0 ? (
              <div className="py-8 text-center text-[12px] text-[var(--text-quaternary)]">
                No past sessions found.
              </div>
            ) : (
              filteredConvs.map((c) => (
                <button
                  key={c.id}
                  onClick={() => loadConversation(c)}
                  className={`w-full text-left p-2.5 rounded-md mb-1 flex items-center gap-2.5 group transition-colors ${
                    activeConv?.id === c.id && activeTab === 'chat' ? 'bg-[var(--accent-tint)]' : 'hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <span className="text-[16px] shrink-0">{getAgentEmoji(c)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-[var(--text-primary)] truncate font-medium">{c.topic || 'New chat'}</p>
                    <p className="text-[11px] text-[var(--text-quaternary)]">{timeAgo(c.created_at)}</p>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(c.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--text-quaternary)] hover:text-[var(--danger)] transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </button>
              ))
            )}
          </div>

          {/* Database & Memory Status Footer */}
          <div className="p-3 bg-[var(--bg-elevated)] border-t border-[var(--border-default)] text-[11px] text-[var(--text-tertiary)] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#4CB782] animate-pulse" />
              <span>Database Synced</span>
            </div>
            <span>{studentSummary?.total_xp ?? 0} XP</span>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex flex-col">
          {activeTab === 'faculty' ? (
            /* Shared Faculty Blackboard & Student Intelligence Dossier */
            <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full space-y-6">
              {/* Header Card */}
              <div className="glass rounded-xl p-6 border border-[var(--border-default)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[20px]">
                      🏛️
                    </div>
                    <div>
                      <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Inter-Agent Faculty Lounge</h2>
                      <p className="text-[13px] text-[var(--text-tertiary)]">
                        The 4 AI mentors collaborate, share pedagogical notes, and track your learning progress together.
                      </p>
                    </div>
                  </div>
                  <Badge variant="success">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Persistent DB Active
                  </Badge>
                </div>

                {/* Student dossier stats grid */}
                <div className="grid grid-cols-4 gap-3 pt-4 border-t border-[var(--border-subtle)]">
                  <div className="bg-[var(--bg-elevated)] p-3 rounded-lg border border-[var(--border-subtle)]">
                    <p className="text-[11px] text-[var(--text-tertiary)]">Total Earned XP</p>
                    <p className="text-[18px] font-bold text-[var(--accent-light)] mt-0.5">{studentSummary?.total_xp ?? 0} XP</p>
                  </div>
                  <div className="bg-[var(--bg-elevated)] p-3 rounded-lg border border-[var(--border-subtle)]">
                    <p className="text-[11px] text-[var(--text-tertiary)]">Current Streak</p>
                    <p className="text-[18px] font-bold text-[#F2C94C] mt-0.5">{studentSummary?.streak ?? 1} Days 🔥</p>
                  </div>
                  <div className="bg-[var(--bg-elevated)] p-3 rounded-lg border border-[var(--border-subtle)]">
                    <p className="text-[11px] text-[var(--text-tertiary)]">Evaluated Level</p>
                    <p className="text-[18px] font-bold text-[var(--text-primary)] capitalize mt-0.5">
                      {studentSummary?.level ?? 'Beginner'}
                    </p>
                  </div>
                  <div className="bg-[var(--bg-elevated)] p-3 rounded-lg border border-[var(--border-subtle)]">
                    <p className="text-[11px] text-[var(--text-tertiary)]">Faculty Notes</p>
                    <p className="text-[18px] font-bold text-[#4EA7FC] mt-0.5">{facultyNotes.length} Shared</p>
                  </div>
                </div>
              </div>

              {/* Mentors Collaborative Notes Feed */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[14px] font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[var(--accent-light)]" />
                    Colleague Observations & Progress Blackboard
                  </h3>
                  <span className="text-[12px] text-[var(--text-tertiary)]">Injected into all future prompts</span>
                </div>

                {facultyNotes.length === 0 ? (
                  <div className="glass rounded-xl p-8 text-center border border-[var(--border-default)]">
                    <Sparkles className="w-8 h-8 text-[var(--text-quaternary)] mx-auto mb-2" />
                    <h4 className="text-[14px] font-medium text-[var(--text-primary)]">No notes recorded yet</h4>
                    <p className="text-[12px] text-[var(--text-tertiary)] max-w-md mx-auto mt-1">
                      Start asking any mentor questions. As you discuss concepts or troubleshoot code, each mentor records observations here for the other 3 mentors to read!
                    </p>
                    <Button
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setActiveTab('chat');
                        setShowNewModal(true);
                      }}
                    >
                      Start First Session
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {facultyNotes.map((note) => {
                      const cfg = NOTE_BADGE_MAP[note.note_type] || NOTE_BADGE_MAP.observation;
                      return (
                        <motion.div
                          key={note.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="glass rounded-xl p-4 border border-[var(--border-default)] hover:border-[var(--border-subtle)] transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[20px]">{note.author_emoji}</span>
                              <span className="text-[13px] font-semibold text-[var(--text-primary)]">{note.author_name}</span>
                              {note.target_agent && (
                                <span className="text-[11px] text-[var(--text-quaternary)]">
                                  → for {DEFAULT_AGENTS.find((a) => a.id === note.target_agent)?.name || note.target_agent}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={cfg.variant}>{cfg.label}</Badge>
                              <span className="text-[11px] text-[var(--text-quaternary)]">{timeAgo(note.created_at)}</span>
                            </div>
                          </div>
                          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed pl-7">
                            "{note.content}"
                          </p>
                          {note.topic && (
                            <div className="mt-2 pl-7 flex items-center gap-1.5">
                              <span className="text-[11px] text-[var(--text-quaternary)]">Topic:</span>
                              <span className="text-[11px] font-mono text-[var(--text-tertiary)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded">
                                {note.topic}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : !activeConv ? (
            /* Agent selection */
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="max-w-2xl w-full">
                <div className="text-center mb-6">
                  <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-1">Choose your mentor</h2>
                  <p className="text-[14px] text-[var(--text-tertiary)]">
                    All mentors share memory through your persistent student dossier and coordinate with each other
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {agents.map((a) => (
                    <motion.button
                      key={a.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => {
                        setNewConvData((p) => ({ ...p, agent_id: a.id }));
                        setShowNewModal(true);
                      }}
                      className={`text-left bg-[var(--bg-elevated)] border rounded-xl p-4 hover:border-[var(--border-default)] transition-all flex flex-col justify-between ${
                        newConvData.agent_id === a.id ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]' : 'border-[var(--border-subtle)]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[28px]">{a.emoji}</span>
                          <Badge variant={BADGE_COLOR_MAP[a.id] || 'accent'}>{a.specialty}</Badge>
                        </div>
                        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{a.name}</h3>
                        <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">{a.title}</p>
                        <p className="text-[12px] text-[var(--text-quaternary)] mt-2 line-clamp-2 leading-relaxed">{a.description}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                        <span className="text-[11px] text-[var(--text-tertiary)]">Start session</span>
                        <span className="text-[13px] text-[var(--accent-light)] font-medium">→</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Chat view */
            <>
              {/* Top bar */}
              <div className="h-12 px-4 border-b border-[var(--border-default)] flex items-center justify-between shrink-0 bg-[var(--bg-panel)]">
                <div className="flex items-center gap-2.5">
                  <span className="text-[18px]">{getAgentEmoji(activeConv)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-[var(--text-primary)]">{getAgentName(activeConv)}</p>
                      <span className="text-[10px] text-[#4CB782] bg-[rgba(76,183,130,0.12)] border border-[rgba(76,183,130,0.25)] px-1.5 py-0.2 rounded-full font-mono">
                        DB Sync
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-quaternary)]">{activeConv.topic}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowNotesDrawer(!showNotesDrawer)}
                    className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors px-2 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
                  >
                    <Users className="w-3.5 h-3.5 text-[var(--accent-light)]" />
                    <span>Faculty Briefing</span>
                    {facultyNotes.length > 0 && (
                      <span className="w-3.5 h-3.5 rounded-full bg-[var(--accent)] text-white text-[9px] flex items-center justify-center">
                        {facultyNotes.length}
                      </span>
                    )}
                  </button>

                  {/* Hint level progression selector */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg">
                    <span className="text-[10px] uppercase font-semibold text-[var(--text-tertiary)] flex items-center gap-1 mr-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Hint Lvl {hintLevel}:
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => changeHintLevel(l)}
                          title={`Click to switch to Level ${l}: ${
                            l === 1 ? 'Socratic Guidance (No code)' :
                            l === 2 ? 'Directional Nudge' :
                            l === 3 ? 'Pseudocode & Logic' :
                            l === 4 ? 'Code Skeleton' : 'Full Solution'
                          }`}
                          className={`w-4 h-2 rounded-sm transition-all cursor-pointer ${
                            l <= hintLevel
                              ? 'bg-[var(--accent)] hover:opacity-80 shadow-sm'
                              : 'bg-[var(--border-default)] hover:bg-[var(--border-hover)]'
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={escalateHint}
                      disabled={hintLevel >= 5}
                      title="Step up to a more direct hint"
                      className="ml-1 text-[11px] font-medium text-[var(--accent-light)] hover:text-white disabled:opacity-40 transition-colors"
                    >
                      {hintLevel < 5 ? '+ Escalate' : 'Max'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Slide-down Faculty Notes Drawer in chat */}
              <AnimatePresence>
                {showNotesDrawer && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-b border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3 text-[12px] overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-[var(--accent-light)]" />
                        Shared Colleague Notes Active For This Session
                      </span>
                      <button
                        onClick={() => setShowNotesDrawer(false)}
                        className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                      >
                        ✕
                      </button>
                    </div>
                    {facultyNotes.length === 0 ? (
                      <p className="text-[var(--text-quaternary)]">
                        No previous faculty notes. Your chat responses will automatically create notes for other mentors.
                      </p>
                    ) : (
                      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                        {facultyNotes.slice(0, 4).map((n) => (
                          <div
                            key={n.id}
                            className="shrink-0 max-w-[260px] p-2 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-subtle)]"
                          >
                            <div className="flex items-center gap-1 mb-1 font-medium text-[var(--text-primary)]">
                              <span>{n.author_emoji}</span>
                              <span className="truncate">{n.author_name}</span>
                            </div>
                            <p className="text-[11px] text-[var(--text-tertiary)] line-clamp-2">
                              "{n.content}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="max-w-[768px] mx-auto space-y-4">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'gap-2.5'}`}>
                      {m.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center text-[14px] shrink-0 mt-0.5">
                          {getAgentEmoji(activeConv)}
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] ${
                          m.role === 'user' ? 'bg-[var(--accent-tint)] rounded-2xl rounded-br-md px-4 py-2.5' : ''
                        }`}
                      >
                        {m.role === 'user' ? (
                          <div className="text-[14px] text-[var(--text-primary)]">
                            {hasCodeBlock(m.content) ? (
                              <div className="markdown-body">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{ pre: CodeBlock }}
                                >
                                  {m.content}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap">{m.content}</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="markdown-body">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{ pre: CodeBlock }}
                              >
                                {m.content}
                              </ReactMarkdown>
                            </div>

                            {/* Action toolbar below assistant response */}
                            <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
                              <button
                                type="button"
                                onClick={() => handleCopyAnswer(m.id, m.content)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors border border-transparent hover:border-[var(--border-subtle)] text-[11px] font-medium cursor-pointer"
                                title="Copy full answer text"
                              >
                                {copiedMessageId === m.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-[#3FB950]" />
                                    <span className="text-[#3FB950]">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy answer</span>
                                  </>
                                )}
                              </button>

                              {hasCodeBlock(m.content) && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyCodeOnly(m.id, m.content)}
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[rgba(99,102,241,0.08)] hover:bg-[rgba(99,102,241,0.18)] text-[var(--accent-light)] transition-colors border border-[rgba(99,102,241,0.2)] text-[11px] font-medium cursor-pointer active:scale-95"
                                  title="Copy code solution directly"
                                >
                                  {copiedCodeMessageId === m.id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-[#3FB950]" />
                                      <span className="text-[#3FB950]">Code copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Code className="w-3.5 h-3.5" />
                                      <span>Copy code directly</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Streaming message */}
                  {streaming && (
                    <div className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center text-[14px] shrink-0">
                        {getAgentEmoji(activeConv)}
                      </div>
                      <div className={`markdown-body ${streamText ? 'streaming-cursor' : ''}`}>
                        {streamText ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{ pre: CodeBlock }}
                          >
                            {streamText}
                          </ReactMarkdown>
                        ) : (
                          <div className="flex gap-1 py-2">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-[var(--text-quaternary)]"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="px-4 pb-4 shrink-0">
                <div className="max-w-[768px] mx-auto">
                  {/* File preview chip if attached */}
                  <AnimatePresence>
                    {attachedFile && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        className="mb-2 px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-between shadow-sm"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[var(--accent-tint)] border border-[rgba(99,102,241,0.25)] flex items-center justify-center text-[var(--accent-light)] shrink-0">
                            <FileCode className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold text-[var(--text-primary)] truncate max-w-[260px] md:max-w-[420px]">
                                {attachedFile.name}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-[var(--text-tertiary)] uppercase font-medium">
                                {attachedFile.language}
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--text-quaternary)]">
                              {attachedFile.lineCount} lines · {(attachedFile.size / 1024).toFixed(1)} KB · Ready to send
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAttachedFile(null)}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-tertiary)] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
                          title="Remove attachment"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="glass rounded-xl px-4 py-2.5 flex items-end gap-2">
                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".py,.js,.ts,.tsx,.jsx,.java,.cpp,.c,.cs,.go,.rs,.rb,.php,.html,.css,.json,.sql,.sh,.txt"
                    />

                    {/* Paperclip attachment button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={streaming}
                      className={`p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors shrink-0 mb-0.5 cursor-pointer ${
                        attachedFile ? 'text-[var(--accent-light)] bg-[var(--accent-tint)]' : ''
                      }`}
                      title={activeConv?.agent_id === 'debug_specialist' ? 'Upload code file to debug (Python, JS, C++, Java, etc.)' : 'Attach code file'}
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        attachedFile
                          ? `Ask ${getAgentName(activeConv)} about ${attachedFile.name}...`
                          : activeConv?.agent_id === 'debug_specialist'
                          ? `Ask Debugger a question or click 📎 to upload a code file...`
                          : `Ask ${getAgentName(activeConv)} a question...`
                      }
                      disabled={streaming}
                      rows={1}
                      className="flex-1 bg-transparent text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-quaternary)] resize-none focus:outline-none max-h-32"
                      style={{ minHeight: '24px' }}
                    />
                    <Button
                      size="sm"
                      onClick={sendMessage}
                      disabled={streaming || (!input.trim() && !attachedFile)}
                      icon={<ArrowUp className="w-3.5 h-3.5" />}
                      className="shrink-0"
                    />
                  </div>
                  <div className="text-[11px] text-[var(--text-quaternary)] text-center mt-1.5 flex items-center justify-center gap-2">
                    <span>Enter to send · Shift+Enter for new line</span>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[var(--accent-light)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Paperclip className="w-3 h-3" />
                      <span>{activeConv?.agent_id === 'debug_specialist' ? 'Upload code to debug' : 'Upload file'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New conversation modal */}
      <AnimatePresence>
        {showNewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowNewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-xl p-6 w-[420px] shadow-[var(--shadow-float)] border border-[var(--border-default)]"
            >
              <h2 className="text-[16px] font-semibold text-[var(--text-primary)] mb-4">New Conversation</h2>
              <div className="space-y-3.5">
                <div>
                  <label className="text-[12px] font-medium text-[var(--text-secondary)] mb-1.5 block">Mentor</label>
                  <select
                    value={newConvData.agent_id}
                    onChange={(e) => setNewConvData((p) => ({ ...p, agent_id: e.target.value }))}
                    className="w-full h-9 px-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="">Select a mentor...</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.emoji} {a.name} — {a.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[var(--text-secondary)] mb-1.5 block">Topic</label>
                  <input
                    type="text"
                    value={newConvData.topic}
                    onChange={(e) => setNewConvData((p) => ({ ...p, topic: e.target.value }))}
                    placeholder="e.g., Binary Search Trees & Node Insertion"
                    className="w-full h-9 px-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-quaternary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[12px] font-medium text-[var(--text-secondary)]">Attach Initial Code File (Optional)</label>
                    <button
                      type="button"
                      onClick={() => modalFileInputRef.current?.click()}
                      className="text-[11px] text-[var(--accent-light)] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Choose file</span>
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={modalFileInputRef}
                    onChange={handleModalFileSelect}
                    className="hidden"
                    accept=".py,.js,.ts,.tsx,.jsx,.java,.cpp,.c,.cs,.go,.rs,.rb,.php,.html,.css,.json,.sql,.sh,.txt"
                  />
                  <select
                    value={newConvData.language}
                    onChange={(e) => setNewConvData((p) => ({ ...p, language: e.target.value }))}
                    className="w-full h-9 px-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2.5 mt-6">
                <Button variant="ghost" className="flex-1" onClick={() => setShowNewModal(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={createConversation}
                  disabled={!newConvData.agent_id || !newConvData.topic.trim()}
                >
                  Start Conversation
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
};

export default AIMentor;
