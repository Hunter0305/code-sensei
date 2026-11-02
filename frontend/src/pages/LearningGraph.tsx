import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import api from '../lib/api';
import { X, Target, TrendingUp, Brain, AlertTriangle, Sparkles, ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConceptNode {
  id: number;
  name: string;
  category: string;
  difficulty: number;
  description: string;
  mastery_score: number;
  mastery_state: string;
  confidence: number;
  attempts: number;
  successful_attempts: number;
  needs_revision: boolean;
  graph_x?: number;
  graph_y?: number;
  prerequisites: number[];
}

interface GraphEdge {
  source: number;
  target: number;
}

const MASTERY_COLORS: Record<string, string> = {
  strong: '#4CB782',
  developing: '#4EA7FC',
  weak: '#F2C94C',
  critical: '#EB5757',
  not_started: '#4E535E',
};

const MASTERY_LABELS: Record<string, string> = {
  strong: 'Mastered',
  developing: 'Developing',
  weak: 'Weak',
  critical: 'Critical',
  not_started: 'Not Started',
};

const CATEGORY_LABELS: Record<string, string> = {
  fundamentals: 'Fundamentals',
  data_structures: 'Data Structures',
  algorithms: 'Algorithms',
  oop: 'OOP',
  functional: 'Functional',
  concurrency: 'Concurrency',
  patterns: 'Design Patterns',
  testing: 'Testing',
  web: 'Web Development',
  databases: 'Databases',
  devops: 'DevOps',
  other: 'Other',
};

const DIFFICULTY_LABELS = ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];

const FILTERS = ['all', 'strong', 'developing', 'weak', 'critical', 'not_started'] as const;
const FILTER_LABELS: Record<string, string> = {
  all: 'All',
  strong: 'Mastered',
  developing: 'Developing',
  weak: 'Weak',
  critical: 'Critical',
  not_started: 'Not Started',
};

const LearningGraph: React.FC = () => {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<ConceptNode[]>([]);
  const [rawEdges, setRawEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<ConceptNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);
  const [testingAttempt, setTestingAttempt] = useState(false);

  const fetchGraph = async () => {
    try {
      const { data } = await api.get('/learning/graph/');
      const graphNodes = data.nodes || data || [];
      const edges = data.edges || [];
      setNodes(graphNodes);
      setRawEdges(edges);

      // Keep selected node in sync if one was open
      if (selected) {
        const updated = graphNodes.find((n: ConceptNode) => n.id === selected.id);
        if (updated) setSelected(updated);
      }
    } catch (err) {
      console.error('Failed to fetch graph', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  // Compute hierarchical DAG positions based on prerequisite depth
  const positions = useMemo(() => {
    if (nodes.length === 0) return {};

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const depthCache = new Map<number, number>();

    const getDepth = (id: number, visited = new Set<number>()): number => {
      if (depthCache.has(id)) return depthCache.get(id)!;
      if (visited.has(id)) return 0;
      visited.add(id);

      const n = nodeMap.get(id);
      if (!n || !n.prerequisites || n.prerequisites.length === 0) {
        depthCache.set(id, 0);
        return 0;
      }

      let maxP = 0;
      for (const pId of n.prerequisites) {
        maxP = Math.max(maxP, getDepth(pId, new Set(visited)) + 1);
      }
      depthCache.set(id, maxP);
      return maxP;
    };

    // Group nodes by tier/depth
    const tiers: Record<number, ConceptNode[]> = {};
    nodes.forEach((n) => {
      const d = getDepth(n.id);
      if (!tiers[d]) tiers[d] = [];
      tiers[d].push(n);
    });

    const maxTier = Math.max(...Object.keys(tiers).map(Number), 0);
    const pos: Record<number, { x: number; y: number }> = {};

    const startX = 90;
    const endX = 1120;
    const stepX = maxTier > 0 ? (endX - startX) / maxTier : 150;
    const canvasHeight = 650;

    Object.entries(tiers).forEach(([tStr, tierNodes]) => {
      const tier = Number(tStr);
      const count = tierNodes.length;
      const x = startX + tier * stepX;

      tierNodes.forEach((n, idx) => {
        // Distribute vertically in this column
        const y = ((idx + 1) / (count + 1)) * (canvasHeight - 120) + 70;
        pos[n.id] = { x, y };
      });
    });

    return pos;
  }, [nodes]);

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: nodes.length };
    nodes.forEach((n) => {
      counts[n.mastery_state] = (counts[n.mastery_state] || 0) + 1;
    });
    return counts;
  }, [nodes]);

  const filteredIds = useMemo(() => {
    if (filter === 'all') return new Set(nodes.map((n) => n.id));
    return new Set(nodes.filter((n) => n.mastery_state === filter).map((n) => n.id));
  }, [nodes, filter]);

  // Directed edges connecting prerequisite relationships
  const edges = useMemo(() => {
    const list: { from: number; to: number }[] = [];
    if (rawEdges.length > 0) {
      rawEdges.forEach((e) => {
        if (positions[e.source] && positions[e.target]) {
          list.push({ from: e.source, to: e.target });
        }
      });
    } else {
      nodes.forEach((n) => {
        (n.prerequisites || []).forEach((prereqId) => {
          if (positions[prereqId] && positions[n.id]) {
            list.push({ from: prereqId, to: n.id });
          }
        });
      });
    }
    return list;
  }, [rawEdges, nodes, positions]);

  // Highlight active prerequisite connections on hover or selection
  const highlightedEdgeIndices = useMemo(() => {
    const targetId = hoveredNodeId || selected?.id;
    if (!targetId) return new Set<number>();

    const set = new Set<number>();
    edges.forEach((e, i) => {
      if (e.from === targetId || e.to === targetId) {
        set.add(i);
      }
    });
    return set;
  }, [hoveredNodeId, selected, edges]);

  // Simulate or practice a concept attempt live in the DB
  const handleSimulateAttempt = async (success: boolean) => {
    if (!selected) return;
    setTestingAttempt(true);
    try {
      await api.post(`/learning/concepts/${selected.id}/attempt/`, {
        success,
        mistake_tags: success ? [] : ['syntax', 'boundary_check'],
      });
      await fetchGraph();
    } catch (err) {
      console.error('Failed to record attempt', err);
    } finally {
      setTestingAttempt(false);
    }
  };

  const overallMastery = useMemo(() => {
    if (nodes.length === 0) return 0;
    const sum = nodes.reduce((acc, n) => acc + (n.mastery_score || 0), 0);
    return Math.round(sum / nodes.length);
  }, [nodes]);

  return (
    <AppLayout title="Learning Graph" subtitle="Living programming knowledge map powered by your submissions & AI mentors" fullHeight>
      <div className="relative h-full flex flex-col">
        {/* Top Control Bar */}
        <div className="px-6 py-3 border-b border-[var(--border-default)] bg-[var(--bg-panel)] flex items-center justify-between shrink-0 z-20">
          {/* Filters */}
          <div className="flex items-center gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all flex items-center gap-1.5 ${
                  filter === f
                    ? 'bg-[var(--accent-tint)] text-[var(--accent-light)] border border-[rgba(94,106,210,0.3)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-transparent'
                }`}
              >
                <span>{FILTER_LABELS[f]}</span>
                <span className="text-[11px] opacity-75 font-mono">({filterCounts[f] || 0})</span>
              </button>
            ))}
          </div>

          {/* Aggregate Knowledge Metrics */}
          <div className="flex items-center gap-4 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-tertiary)]">Overall Mastery:</span>
              <span className="font-mono font-semibold text-[var(--text-primary)]">{overallMastery}%</span>
              <div className="w-16 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                <div className="h-full bg-[var(--accent)] rounded-full transition-all duration-500" style={{ width: `${overallMastery}%` }} />
              </div>
            </div>
            <div className="h-4 w-px bg-[var(--border-default)]" />
            <div className="flex items-center gap-1.5 text-[var(--text-tertiary)] font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4CB782]" />
              <span>{nodes.length} Concepts Tracked</span>
            </div>
          </div>
        </div>

        {/* Graph Workspace */}
        <div className="flex-1 relative overflow-hidden flex">
          {/* Main SVG Graph */}
          <div className="flex-1 relative overflow-auto no-scrollbar">
            {/* Background grid */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, var(--border-default) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                opacity: 0.25,
              }}
            />

            {/* Directional legend watermark */}
            <div className="absolute top-4 left-6 pointer-events-none text-[11px] text-[var(--text-quaternary)] uppercase tracking-wider flex items-center gap-2 font-mono">
              <span>Foundations</span>
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Advanced Data Structures & Algorithms</span>
            </div>

            {/* Bottom Legend */}
            <div className="absolute bottom-4 left-6 z-10 glass rounded-lg px-3 py-2 flex items-center gap-4 border border-[var(--border-default)]">
              {Object.entries(MASTERY_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: MASTERY_COLORS[key] }} />
                  <span className="text-[11px] text-[var(--text-tertiary)]">{label}</span>
                </div>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-full text-[var(--text-tertiary)] text-sm">
                Loading knowledge graph...
              </div>
            ) : (
              <svg className="w-full h-full min-w-[1200px] min-h-[660px]" viewBox="0 0 1200 660">
                <defs>
                  {/* Default arrow marker */}
                  <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(255,255,255,0.18)" />
                  </marker>
                  {/* Highlighted arrow marker */}
                  <marker id="arrow-active" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#5E6AD2" />
                  </marker>
                </defs>

                {/* Directed Prerequisite Curves */}
                {edges.map((e, i) => {
                  const from = positions[e.from];
                  const to = positions[e.to];
                  if (!from || !to) return null;

                  const isHighlighted = highlightedEdgeIndices.has(i);
                  const isVisible = filteredIds.has(e.from) && filteredIds.has(e.to);

                  // Smooth cubic bezier curve from left to right
                  const midX = (from.x + to.x) / 2;
                  const pathData = `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;

                  return (
                    <path
                      key={i}
                      d={pathData}
                      fill="none"
                      stroke={isHighlighted ? '#5E6AD2' : 'var(--border-default)'}
                      strokeWidth={isHighlighted ? 2 : 1}
                      strokeDasharray={isHighlighted ? 'none' : '4 3'}
                      opacity={isHighlighted ? 0.9 : isVisible ? 0.35 : 0.08}
                      markerEnd={isHighlighted ? 'url(#arrow-active)' : 'url(#arrow)'}
                      className="transition-all duration-200"
                    />
                  );
                })}

                {/* Concept Nodes */}
                {nodes.map((n) => {
                  const pos = positions[n.id];
                  if (!pos) return null;

                  const isFiltered = filteredIds.has(n.id);
                  const isSelected = selected?.id === n.id;
                  const isHovered = hoveredNodeId === n.id;
                  const color = MASTERY_COLORS[n.mastery_state] || MASTERY_COLORS.not_started;
                  const isPrereqOfTarget = (selected?.prerequisites || []).includes(n.id);

                  return (
                    <g
                      key={n.id}
                      onClick={() => setSelected(n)}
                      onMouseEnter={() => setHoveredNodeId(n.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      className="cursor-pointer group"
                      opacity={isFiltered ? 1 : 0.15}
                    >
                      {/* Outer Glow Halo */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isSelected || isHovered ? 24 : 18}
                        fill={color}
                        opacity={isSelected ? 0.25 : isHovered ? 0.2 : 0.08}
                        className="transition-all duration-200"
                      />

                      {/* Main Node Disc */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isSelected ? 11 : 9}
                        fill="var(--bg-base)"
                        stroke={isSelected ? '#FFFFFF' : isPrereqOfTarget ? '#5E6AD2' : color}
                        strokeWidth={isSelected ? 2.5 : isPrereqOfTarget ? 2 : 1.75}
                        className="transition-all duration-200"
                      />

                      {/* Inner Status Indicator Core */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={n.mastery_score > 0 ? 5 : 3.5}
                        fill={color}
                      />

                      {/* Pulsing Alert Ring for Critical State */}
                      {n.mastery_state === 'critical' && (
                        <circle cx={pos.x} cy={pos.y} r={14} fill="none" stroke="#EB5757" strokeWidth={1}>
                          <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )}

                      {/* Mastery % Badge above node if active */}
                      {n.mastery_score > 0 && (
                        <text
                          x={pos.x}
                          y={pos.y - 14}
                          textAnchor="middle"
                          fill={color}
                          fontSize={9}
                          fontWeight="600"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {Math.round(n.mastery_score)}%
                        </text>
                      )}

                      {/* Node Label Below */}
                      <text
                        x={pos.x}
                        y={pos.y + 22}
                        textAnchor="middle"
                        fill={isSelected ? '#FFFFFF' : isHovered ? 'var(--text-primary)' : 'var(--text-secondary)'}
                        fontSize={11}
                        fontWeight={isSelected || isHovered ? '600' : '400'}
                        fontFamily="Inter, sans-serif"
                        className="transition-colors duration-150 select-none"
                      >
                        {n.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          {/* Interactive Inspection & Detail Panel */}
          <AnimatePresence>
            {selected && (
              <motion.aside
                initial={{ x: 340, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 340, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="w-[340px] shrink-0 bg-[var(--bg-panel)] border-l border-[var(--border-default)] flex flex-col overflow-y-auto glass z-20 shadow-[-10px_0_25px_rgba(0,0,0,0.4)]"
              >
                {/* Header */}
                <div className="p-5 border-b border-[var(--border-default)] flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider">
                        {CATEGORY_LABELS[selected.category] || selected.category}
                      </span>
                      <span className="text-[var(--border-default)]">·</span>
                      <span className="text-[11px] text-[var(--text-tertiary)]">
                        {DIFFICULTY_LABELS[selected.difficulty]}
                      </span>
                    </div>
                    <h2 className="text-[17px] font-bold text-[var(--text-primary)]">{selected.name}</h2>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-1.5 rounded-lg text-[var(--text-quaternary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Live Mastery Meter */}
                <div className="p-5 border-b border-[var(--border-default)]">
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant={
                        selected.mastery_state === 'strong'
                          ? 'success'
                          : selected.mastery_state === 'developing'
                          ? 'info'
                          : selected.mastery_state === 'weak'
                          ? 'warning'
                          : selected.mastery_state === 'critical'
                          ? 'danger'
                          : 'neutral'
                      }
                    >
                      {MASTERY_LABELS[selected.mastery_state]}
                    </Badge>
                    <span
                      className="text-[20px] font-bold font-mono"
                      style={{ color: MASTERY_COLORS[selected.mastery_state] }}
                    >
                      {Math.round(selected.mastery_score)}%
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-[var(--bg-base)] overflow-hidden border border-[var(--border-subtle)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(selected.mastery_score, 4)}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full rounded-full"
                      style={{ background: MASTERY_COLORS[selected.mastery_state] }}
                    />
                  </div>
                </div>

                {/* Real-time stats */}
                <div className="p-5 grid grid-cols-2 gap-2.5 border-b border-[var(--border-default)]">
                  {[
                    { icon: Target, label: 'Attempts', value: selected.attempts },
                    { icon: TrendingUp, label: 'Confidence', value: `${Math.round(selected.confidence)}%` },
                    {
                      icon: Brain,
                      label: 'Pass Rate',
                      value: selected.attempts > 0 ? `${Math.round((selected.successful_attempts / selected.attempts) * 100)}%` : '—',
                    },
                    { icon: AlertTriangle, label: 'Needs Review', value: selected.needs_revision ? 'Yes' : 'No' },
                  ].map((s) => (
                    <div key={s.label} className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 text-[var(--text-quaternary)] mb-1">
                        <s.icon className="w-3 h-3" />
                        <span className="text-[11px]">{s.label}</span>
                      </div>
                      <p className="text-[15px] font-bold text-[var(--text-primary)] font-mono">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Prerequisites Tree Info */}
                <div className="p-5 border-b border-[var(--border-default)] space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
                      Prerequisites (Requires)
                    </p>
                    {selected.prerequisites && selected.prerequisites.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selected.prerequisites.map((pId) => {
                          const pNode = nodes.find((n) => n.id === pId);
                          return (
                            <button
                              key={pId}
                              onClick={() => pNode && setSelected(pNode)}
                              className="px-2 py-1 bg-[var(--bg-base)] border border-[var(--border-subtle)] hover:border-[var(--accent)] rounded text-[11px] text-[var(--text-secondary)] hover:text-white transition-colors"
                            >
                              ← {pNode?.name || `Concept #${pId}`}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[12px] text-[var(--text-quaternary)]">None (Foundational Root Node)</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="p-5 border-b border-[var(--border-default)]">
                  <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
                    About This Concept
                  </p>
                  <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                    {selected.description || 'Core building block in programming foundations.'}
                  </p>
                </div>

                {/* AI Mentor Pedagogical Suggestion */}
                <div className="p-5 flex-1">
                  <div className="bg-[var(--accent-tint)] border border-[rgba(94,106,210,0.25)] rounded-xl p-3.5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[var(--accent-light)]" />
                      <span className="text-[12px] font-semibold text-[var(--accent-light)]">Adaptive Recommendation</span>
                    </div>
                    <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                      {selected.mastery_state === 'not_started' &&
                        `You have not practiced ${selected.name} yet. Review its prerequisites first, or discuss it with Professor.`}
                      {selected.mastery_state === 'developing' &&
                        `Good momentum on ${selected.name}! Try solving 1-2 more problems to lock in your long-term retention.`}
                      {selected.mastery_state === 'weak' &&
                        `Struggling with ${selected.name}. Consult Debug Specialist to isolate specific error patterns.`}
                      {selected.mastery_state === 'critical' &&
                        `Repeated errors detected in ${selected.name}. Immediate targeted review recommended.`}
                      {selected.mastery_state === 'strong' &&
                        `Concept mastered! You have unlocked subsequent algorithmic modules in the tree.`}
                    </p>
                  </div>

                  {/* Live Simulation Trigger (To prove it's connected to DB live!) */}
                  <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-[var(--text-tertiary)] font-medium">Verify Database Score Link:</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1 text-[11px] h-8"
                        disabled={testingAttempt}
                        onClick={() => handleSimulateAttempt(true)}
                      >
                        <Play className="w-3 h-3 mr-1 text-[#4CB782]" />
                        +Pass Problem
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1 text-[11px] h-8"
                        disabled={testingAttempt}
                        onClick={() => handleSimulateAttempt(false)}
                      >
                        <AlertTriangle className="w-3 h-3 mr-1 text-[#EB5757]" />
                        +Fail Problem
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Primary Actions */}
                <div className="p-5 border-t border-[var(--border-default)] bg-[var(--bg-panel)] flex gap-2.5">
                  <Button
                    className="flex-1"
                    size="sm"
                    onClick={() => navigate('/assessments')}
                  >
                    Practice Problems
                  </Button>
                  <Button
                    className="flex-1"
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/mentor')}
                  >
                    Ask Mentor
                  </Button>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
};

export default LearningGraph;
