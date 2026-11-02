import React from 'react';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import type { Conversation } from '../../services/mentorService';

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
  onDelete: (id: number) => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete
}) => {
  return (
    <div style={{
      width: '280px',
      background: '#161B22',
      borderRight: '1px solid #30363D',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #30363D' }}>
        <button
          onClick={onNew}
          style={{
            width: '100%',
            padding: '10px 16px',
            background: '#238636',
            color: '#fff',
            border: '1px solid rgba(240,246,252,0.1)',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#2EA043'}
          onMouseLeave={e => e.currentTarget.style.background = '#238636'}
        >
          <Plus size={16} /> New Conversation
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        <h3 style={{
          fontSize: '12px',
          fontWeight: 600,
          color: '#8B949E',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '12px',
          padding: '0 4px'
        }}>
          History
        </h3>
        
        {conversations.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#8B949E', textAlign: 'center', marginTop: '24px' }}>
            No recent conversations.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: activeId === conv.id ? '#1F242C' : 'transparent',
                  border: `1px solid ${activeId === conv.id ? '#30363D' : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => {
                  if (activeId !== conv.id) e.currentTarget.style.background = '#1C2128';
                }}
                onMouseLeave={e => {
                  if (activeId !== conv.id) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  <MessageSquare size={16} color={activeId === conv.id ? '#F0F6FC' : '#8B949E'} />
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{
                      margin: 0,
                      fontSize: '13px',
                      fontWeight: activeId === conv.id ? 600 : 500,
                      color: activeId === conv.id ? '#F0F6FC' : '#C9D1D9',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {conv.title || 'Untitled Conversation'}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#8B949E' }}>
                      {conv.agent_name || conv.agent_id}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#8B949E',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    opacity: activeId === conv.id ? 1 : 0.5,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#F85149';
                    e.currentTarget.style.background = 'rgba(248,81,73,0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = '#8B949E';
                    e.currentTarget.style.background = 'none';
                  }}
                  title="Delete conversation"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
