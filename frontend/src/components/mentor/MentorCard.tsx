/**
 * MentorCard — Agent selector card shown before starting a conversation
 */
import React from 'react';
import type { AgentInfo } from '../../services/mentorService';

interface MentorCardProps {
  agent: AgentInfo;
  isSelected: boolean;
  onClick: (agent: AgentInfo) => void;
}

const COLOR_MAP: Record<string, { ring: string; bg: string; text: string }> = {
  purple: { ring: '#7C3AED', bg: 'rgba(124,58,237,0.1)',  text: '#C4B5FD' },
  blue:   { ring: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  text: '#93C5FD' },
  red:    { ring: '#EF4444', bg: 'rgba(239,68,68,0.1)',   text: '#FCA5A5' },
  green:  { ring: '#22C55E', bg: 'rgba(34,197,94,0.1)',   text: '#86EFAC' },
};

export const MentorCard: React.FC<MentorCardProps> = ({ agent, isSelected, onClick }) => {
  const c = COLOR_MAP[agent.color] ?? COLOR_MAP.purple;

  return (
    <button
      onClick={() => onClick(agent)}
      style={{
        width: '100%',
        textAlign: 'left',
        background: isSelected
          ? `linear-gradient(135deg, ${c.bg}, rgba(124,58,237,0.08))`
          : 'rgba(22,27,34,0.8)',
        border: `2px solid ${isSelected ? c.ring : '#30363D'}`,
        borderRadius: '12px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: isSelected ? `0 0 20px ${c.ring}40` : 'none',
      }}
      onMouseEnter={e => {
        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.borderColor = c.ring + '60';
      }}
      onMouseLeave={e => {
        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.borderColor = '#30363D';
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 48, height: 48, borderRadius: '12px',
        background: c.bg, border: `1px solid ${c.ring}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '24px', marginBottom: '12px',
      }}>
        {agent.emoji}
      </div>

      {/* Specialty badge */}
      <span style={{
        display: 'inline-block', fontSize: '10px', fontWeight: 700,
        color: c.text, background: c.bg,
        padding: '2px 8px', borderRadius: '999px',
        border: `1px solid ${c.ring}40`, marginBottom: '8px',
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        {agent.specialty}
      </span>

      {/* Name */}
      <h3 style={{
        fontSize: '15px', fontWeight: 700,
        fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
        color: '#F0F6FC', margin: '0 0 6px',
      }}>
        {agent.name}
      </h3>

      {/* Description */}
      <p style={{ fontSize: '12px', color: '#8B949E', lineHeight: 1.5, margin: 0 }}>
        {agent.description}
      </p>

      {/* Selected indicator */}
      {isSelected && (
        <div style={{
          marginTop: '12px', padding: '6px 10px', borderRadius: '6px',
          background: c.bg, border: `1px solid ${c.ring}50`,
          fontSize: '11px', fontWeight: 600, color: c.text,
        }}>
          Selected — Start chatting below
        </div>
      )}
    </button>
  );
};
