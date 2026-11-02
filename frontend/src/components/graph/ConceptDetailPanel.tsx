/**
 * ConceptDetailPanel — Right-side panel showing selected concept details
 */
import React from 'react';
import { X, Brain, Target, AlertTriangle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ConceptNode } from '../../services/learningService';

interface ConceptDetailPanelProps {
  concept: ConceptNode | null;
  onClose: () => void;
}

const STATE_CONFIG = {
  strong:      { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)',   label: 'Strong',      icon: '💪' },
  developing:  { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)',  label: 'Developing',  icon: '📈' },
  weak:        { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)',  label: 'Weak',        icon: '⚠️' },
  critical:    { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)',   label: 'Critical',    icon: '🚨' },
  not_started: { color: '#8B949E', bg: 'rgba(48,54,61,0.4)',     border: 'rgba(48,54,61,0.6)',     label: 'Not Started', icon: '⬜' },
};

const CATEGORY_LABELS: Record<string, string> = {
  fundamentals:    'Fundamentals',
  data_structures: 'Data Structures',
  algorithms:      'Algorithms',
  oop:             'OOP',
  functional:      'Functional',
  concurrency:     'Concurrency',
  patterns:        'Design Patterns',
  testing:         'Testing',
  web:             'Web Dev',
  databases:       'Databases',
  devops:          'DevOps',
  other:           'Other',
};

const DIFFICULTY_LABELS = ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];

export const ConceptDetailPanel: React.FC<ConceptDetailPanelProps> = ({ concept, onClose }) => {
  const navigate = useNavigate();
  if (!concept) return null;

  const cfg = STATE_CONFIG[concept.mastery_state];
  const accuracy = concept.attempts > 0
    ? Math.round(((concept.attempts - (concept.attempts - (concept.mastery_score / 10 * concept.attempts / 10))) / concept.attempts) * 100)
    : 0;

  return (
    <aside
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: '320px',
        background: '#161B22',
        borderLeft: '1px solid #30363D',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        animation: 'slide-in-right 0.25s ease-out',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid #30363D', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <span
            style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: 600,
              color: '#8B949E',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '6px',
            }}
          >
            {CATEGORY_LABELS[concept.category]} · {DIFFICULTY_LABELS[concept.difficulty]}
          </span>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
              color: '#F0F6FC',
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            {concept.name}
          </h2>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#8B949E',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            transition: 'color 0.15s',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Mastery state badge */}
      <div style={{ padding: '16px', borderBottom: '1px solid #30363D' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px',
            borderRadius: '10px',
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
          }}
        >
          <span style={{ fontSize: '20px' }}>{cfg.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
              <span style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: cfg.color }}>
                {Math.round(concept.mastery_score)}%
              </span>
            </div>
            {/* Mastery progress bar */}
            <div style={{ height: '6px', borderRadius: '9999px', background: '#21262D', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${concept.mastery_score}%`,
                  background: cfg.color,
                  borderRadius: '9999px',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', borderBottom: '1px solid #30363D' }}>
        {[
          { icon: <Target size={14} />, label: 'Attempts',   value: concept.attempts },
          { icon: <TrendingUp size={14} />, label: 'Confidence', value: `${Math.round(concept.confidence)}%` },
          { icon: <Brain size={14} />, label: 'Correct',    value: concept.attempts > 0 ? `${accuracy}%` : '—' },
          { icon: <AlertTriangle size={14} />, label: 'Needs Work', value: concept.needs_revision ? 'Yes' : 'No' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: '#21262D',
              border: '1px solid #30363D',
              borderRadius: '8px',
              padding: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8B949E', marginBottom: '4px' }}>
              {stat.icon}
              <span style={{ fontSize: '11px', fontWeight: 500 }}>{stat.label}</span>
            </div>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#F0F6FC', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Description */}
      <div style={{ padding: '16px', borderBottom: '1px solid #30363D' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#8B949E', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          About this Concept
        </h3>
        <p style={{ fontSize: '13px', color: '#8B949E', lineHeight: 1.6, margin: 0 }}>
          {concept.description || 'No description available.'}
        </p>
      </div>

      {/* AI Recommendation */}
      <div style={{ padding: '16px', flex: 1 }}>
        <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#8B949E', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          AI Recommendation
        </h3>
        <div
          style={{
            padding: '12px',
            borderRadius: '8px',
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.2)',
          }}
        >
          <p style={{ fontSize: '13px', color: '#C4B5FD', lineHeight: 1.6, margin: 0 }}>
            {concept.mastery_state === 'not_started' && `Start by understanding the fundamentals of ${concept.name}. Ask the Professor mentor for a conceptual introduction.`}
            {concept.mastery_state === 'developing'  && `Keep practicing ${concept.name}. Try 2–3 more problems to solidify your understanding.`}
            {concept.mastery_state === 'weak'        && `${concept.name} needs attention. Use the Debug Specialist to diagnose your mistakes.`}
            {concept.mastery_state === 'critical'    && `You have repeated mistakes in ${concept.name}. Schedule a focused review session immediately.`}
            {concept.mastery_state === 'strong'      && `Great mastery of ${concept.name}! Move to more advanced topics that depend on this concept.`}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: '16px', borderTop: '1px solid #30363D', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => navigate('/assessments')}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: '#7C3AED',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Practice Now
        </button>
        <button
          onClick={() => navigate('/mentor')}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: 'transparent',
            color: '#8B949E',
            border: '1px solid #30363D',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Ask Mentor
        </button>
      </div>
    </aside>
  );
};

export default ConceptDetailPanel;
