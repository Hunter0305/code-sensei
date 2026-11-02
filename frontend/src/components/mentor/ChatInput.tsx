import React, { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Send, CornerDownLeft } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSend, 
  disabled = false,
  placeholder = "Type your message here... (Shift+Enter for new line)"
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      position: 'relative',
      background: '#161B22',
      border: '1px solid #30363D',
      borderRadius: '12px',
      padding: '12px',
      paddingRight: '60px', // space for button
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      transition: 'border-color 0.2s ease',
    }}
    onFocus={(e) => e.currentTarget.style.borderColor = '#7C3AED'}
    onBlur={(e) => e.currentTarget.style.borderColor = '#30363D'}
    >
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          color: '#F0F6FC',
          fontSize: '15px',
          lineHeight: '1.5',
          resize: 'none',
          outline: 'none',
          minHeight: '24px',
          maxHeight: '200px',
          fontFamily: 'Inter, sans-serif',
        }}
      />
      
      <button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        style={{
          position: 'absolute',
          right: '12px',
          bottom: '12px',
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: disabled || !input.trim() ? '#21262D' : '#7C3AED',
          color: disabled || !input.trim() ? '#484F58' : '#fff',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled || !input.trim() ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}
        title="Send (Enter)"
      >
        <Send size={18} />
      </button>

      <div style={{
        position: 'absolute',
        bottom: '-24px',
        right: '12px',
        fontSize: '11px',
        color: '#8B949E',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <span><CornerDownLeft size={10} /> Enter to send</span>
      </div>
    </div>
  );
};
