import React, { useState } from 'react';
import type { ChatMessage as IChatMessage, AgentInfo } from '../../services/mentorService';
import { User, Copy, Check } from 'lucide-react';

interface ChatMessageProps {
  message: IChatMessage;
  agent?: AgentInfo | null;
}

const CodeSnippet: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code.trim();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{
      background: '#0D1117',
      borderRadius: '8px',
      border: '1px solid #30363D',
      marginTop: '8px',
      marginBottom: '8px',
      overflow: 'hidden'
    }}>
      <div style={{
        background: '#161B22',
        padding: '6px 12px',
        fontSize: '11px',
        color: '#8B949E',
        borderBottom: '1px solid #30363D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: copied ? '#3FB950' : '#C9D1D9',
            padding: '2px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {copied ? <Check size={12} color="#3FB950" /> : <Copy size={12} />}
          <span>{copied ? 'Copied!' : 'Copy code'}</span>
        </button>
      </div>
      <pre style={{ margin: 0, padding: '12px', overflowX: 'auto' }}>
        <code style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '13px',
          color: '#E6EDF3',
          whiteSpace: 'pre'
        }}>
          {code}
        </code>
      </pre>
    </div>
  );
};

const renderContent = (content: string) => {
  // Simple regex parser for markdown code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);
  
  return parts.map((part, idx) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const match = part.match(/```(\w*)\n([\s\S]*?)```/);
      const language = match ? match[1] : '';
      const code = match ? match[2] : part.slice(3, -3);
      
      return <CodeSnippet key={idx} language={language} code={code} />;
    }
    
    // For regular text, split by single backticks for inline code
    return (
      <div key={idx} style={{ whiteSpace: 'pre-wrap', marginBottom: '8px', lineHeight: 1.6 }}>
        {part.split(/(`[^`]+`)/g).map((subPart, subIdx) => {
          if (subPart.startsWith('`') && subPart.endsWith('`')) {
            return (
              <code key={subIdx} style={{
                background: 'rgba(110, 118, 129, 0.2)',
                padding: '2px 6px',
                borderRadius: '6px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '13px',
                color: '#E6EDF3'
              }}>
                {subPart.slice(1, -1)}
              </code>
            );
          }
          return <span key={subIdx}>{subPart}</span>;
        })}
      </div>
    );
  });
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, agent }) => {
  const isUser = message.role === 'user';
  
  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      padding: '20px',
      borderBottom: '1px solid #30363D',
      background: isUser ? 'transparent' : 'rgba(22, 27, 34, 0.5)',
    }}>
      {/* Avatar */}
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '8px',
        background: isUser ? '#21262D' : (agent ? `${agent.accent}20` : '#7C3AED20'),
        border: `1px solid ${isUser ? '#30363D' : (agent ? `${agent.accent}40` : '#7C3AED40')}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: '18px'
      }}>
        {isUser ? <User size={20} color="#8B949E" /> : (agent ? agent.emoji : '🤖')}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, color: '#C9D1D9', fontSize: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontWeight: 600, color: '#F0F6FC' }}>
            {isUser ? 'You' : (agent ? agent.name : 'AI Mentor')}
          </span>
          <span style={{ fontSize: '12px', color: '#8B949E' }}>
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {!isUser && message.hint_level_at_send > 1 && (
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#D2A8FF',
              background: 'rgba(210, 168, 255, 0.1)',
              padding: '2px 6px',
              borderRadius: '999px',
              border: '1px solid rgba(210, 168, 255, 0.2)'
            }}>
              HINT LEVEL {message.hint_level_at_send}
            </span>
          )}
        </div>
        
        <div className="markdown-body">
          {renderContent(message.content)}
        </div>
      </div>
    </div>
  );
};
