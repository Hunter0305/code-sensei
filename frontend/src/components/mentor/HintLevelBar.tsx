import React from 'react';
import { HelpCircle, ChevronRight, Lock } from 'lucide-react';

interface HintLevelBarProps {
  currentLevel: number;
  onEscalate: () => void;
  isEscalating: boolean;
}

const LEVEL_DESCRIPTIONS = [
  'General nudges',
  'Directional hints',
  'Algorithmic hints',
  'Partial solutions',
  'Full solutions',
];

export const HintLevelBar: React.FC<HintLevelBarProps> = ({ currentLevel, onEscalate, isEscalating }) => {
  return (
    <div style={{
      background: '#161B22',
      borderBottom: '1px solid #30363D',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          color: '#8B949E',
          fontSize: '13px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <HelpCircle size={16} />
          <span>Hint Progression</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {[1, 2, 3, 4, 5].map((level) => (
            <React.Fragment key={level}>
              <div 
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  transition: 'all 0.3s ease',
                  ...(level <= currentLevel ? {
                    background: level === currentLevel ? '#7C3AED' : '#7C3AED40',
                    color: level === currentLevel ? '#fff' : '#C4B5FD',
                    border: '1px solid #7C3AED',
                    boxShadow: level === currentLevel ? '0 0 10px rgba(124,58,237,0.4)' : 'none'
                  } : {
                    background: '#21262D',
                    color: '#484F58',
                    border: '1px solid #30363D',
                  })
                }}
                title={LEVEL_DESCRIPTIONS[level - 1]}
              >
                {level}
              </div>
              {level < 5 && (
                <ChevronRight size={14} color={level < currentLevel ? '#7C3AED' : '#30363D'} />
              )}
            </React.Fragment>
          ))}
        </div>
        
        <span style={{ fontSize: '13px', color: '#E6EDF3', marginLeft: '8px' }}>
          Current: <strong style={{ color: '#C4B5FD' }}>{LEVEL_DESCRIPTIONS[currentLevel - 1]}</strong>
        </span>
      </div>

      <button
        onClick={onEscalate}
        disabled={currentLevel >= 5 || isEscalating}
        style={{
          background: currentLevel >= 5 ? '#21262D' : 'rgba(124,58,237,0.1)',
          color: currentLevel >= 5 ? '#484F58' : '#C4B5FD',
          border: `1px solid ${currentLevel >= 5 ? '#30363D' : 'rgba(124,58,237,0.3)'}`,
          borderRadius: '6px',
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: currentLevel >= 5 || isEscalating ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s',
        }}
      >
        {currentLevel >= 5 ? (
          <><Lock size={14} /> Max Level Reached</>
        ) : isEscalating ? (
          'Escalating...'
        ) : (
          'Escalate Hint Level'
        )}
      </button>
    </div>
  );
};
