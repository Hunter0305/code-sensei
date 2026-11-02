/**
 * GraphNode — Custom ReactFlow node for the Learning Memory Graph
 * Color-coded by mastery state, shows concept name + score ring
 */
import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { ConceptNode } from '../../services/learningService';

// ── Mastery state → visual style mapping ─────────────────────
const MASTERY_STYLES: Record<
  ConceptNode['mastery_state'],
  { ring: string; bg: string; text: string; label: string; glow: string }
> = {
  strong: {
    ring: '#22C55E',
    bg: 'rgba(34,197,94,0.12)',
    text: '#4ADE80',
    label: 'Strong',
    glow: 'rgba(34,197,94,0.35)',
  },
  developing: {
    ring: '#3B82F6',
    bg: 'rgba(59,130,246,0.12)',
    text: '#60A5FA',
    label: 'Developing',
    glow: 'rgba(59,130,246,0.35)',
  },
  weak: {
    ring: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
    text: '#FBBF24',
    label: 'Weak',
    glow: 'rgba(245,158,11,0.3)',
  },
  critical: {
    ring: '#EF4444',
    bg: 'rgba(239,68,68,0.12)',
    text: '#F87171',
    label: 'Critical',
    glow: 'rgba(239,68,68,0.35)',
  },
  not_started: {
    ring: '#484F58',
    bg: 'rgba(48,54,61,0.4)',
    text: '#8B949E',
    label: 'Not Started',
    glow: 'transparent',
  },
};

// Category → icon map
const CATEGORY_ICONS: Record<string, string> = {
  fundamentals:    '⚡',
  data_structures: '🗂️',
  algorithms:      '🔄',
  oop:             '🏗️',
  functional:      '🔧',
  concurrency:     '⚙️',
  patterns:        '🎨',
  testing:         '🧪',
  web:             '🌐',
  databases:       '🗄️',
  devops:          '🚀',
  other:           '📌',
};

export interface GraphNodeData extends ConceptNode {
  isSelected: boolean;
  onClick: (node: ConceptNode) => void;
}

const GraphNode: React.FC<NodeProps<GraphNodeData>> = ({ data, selected }) => {
  const style = MASTERY_STYLES[data.mastery_state];
  const icon  = CATEGORY_ICONS[data.category] || '📌';
  const isActive = selected || data.isSelected;

  return (
    <>
      {/* Target handle (prerequisites come IN here) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: style.ring, border: 'none', width: 6, height: 6 }}
      />

      {/* Node body */}
      <div
        onClick={() => data.onClick(data)}
        style={{
          background: isActive
            ? `linear-gradient(135deg, ${style.bg}, rgba(124,58,237,0.15))`
            : style.bg,
          border: `2px solid ${isActive ? '#7C3AED' : style.ring}`,
          borderRadius: '12px',
          padding: '10px 14px',
          minWidth: '130px',
          maxWidth: '160px',
          cursor: 'pointer',
          boxShadow: isActive
            ? `0 0 20px rgba(124,58,237,0.5), 0 0 0 1px rgba(124,58,237,0.3)`
            : `0 0 12px ${style.glow}, 0 2px 8px rgba(0,0,0,0.4)`,
          transition: 'all 0.2s ease',
          position: 'relative',
        }}
      >
        {/* Category icon + score */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '14px' }}>{icon}</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'JetBrains Mono, monospace',
              color: data.mastery_score > 0 ? style.text : '#484F58',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '4px',
              padding: '1px 5px',
            }}
          >
            {data.mastery_score > 0 ? `${Math.round(data.mastery_score)}%` : '—'}
          </span>
        </div>

        {/* Concept name */}
        <p
          style={{
            color: '#F0F6FC',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
            lineHeight: 1.3,
            margin: 0,
          }}
        >
          {data.name}
        </p>

        {/* Difficulty dots */}
        <div style={{ display: 'flex', gap: '2px', marginTop: '6px' }}>
          {[1, 2, 3, 4, 5].map((d) => (
            <div
              key={d}
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: d <= data.difficulty ? style.ring : '#30363D',
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>

        {/* Mastery bar */}
        {data.mastery_score > 0 && (
          <div
            style={{
              marginTop: '6px',
              height: '3px',
              borderRadius: '9999px',
              background: '#21262D',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${data.mastery_score}%`,
                borderRadius: '9999px',
                background: style.ring,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        )}

        {/* Needs revision badge */}
        {data.needs_revision && (
          <div
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#F59E0B',
              border: '2px solid #161B22',
            }}
          />
        )}
      </div>

      {/* Source handle (this node unlocks others) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: style.ring, border: 'none', width: 6, height: 6 }}
      />
    </>
  );
};

export default memo(GraphNode);
