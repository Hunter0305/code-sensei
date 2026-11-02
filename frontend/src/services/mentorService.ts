/**
 * Mentor API Service — conversations, streaming chat, hint escalation
 */
import api from './api';

export interface AgentInfo {
  id: string;
  name: string;
  title: string;
  emoji: string;
  specialty: string;
  description: string;
  color: string;
  accent: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  hint_level_at_send: number;
  created_at: string;
}

export interface Conversation {
  id: number;
  agent_id: string;
  agent_info?: AgentInfo;
  title: string;
  topic: string;
  hint_level: number;
  code_context: string;
  language: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
  last_message?: { role: string; content: string; created_at: string } | null;
  message_count?: number;
  agent_name?: string;
}

export interface OllamaStatus {
  agents: AgentInfo[];
  ollama_online: boolean;
  model: string;
}

export const mentorService = {
  /** List available agents + Ollama status */
  async getAgents(): Promise<OllamaStatus> {
    const r = await api.get<OllamaStatus>('/mentor/agents/');
    return r.data;
  },

  /** List user's conversation history */
  async getConversations(): Promise<Conversation[]> {
    const r = await api.get<Conversation[]>('/mentor/conversations/');
    return Array.isArray(r.data) ? r.data : (r.data as any).results ?? [];
  },

  /** Start a new conversation */
  async createConversation(agentId: string, topic = '', language = 'python'): Promise<Conversation> {
    const r = await api.post<Conversation>('/mentor/conversations/', {
      agent_id: agentId,
      topic,
      language,
    });
    return r.data;
  },

  /** Load full conversation with messages */
  async getConversation(id: number): Promise<Conversation> {
    const r = await api.get<Conversation>(`/mentor/conversations/${id}/`);
    return r.data;
  },

  /** Delete a conversation */
  async deleteConversation(id: number): Promise<void> {
    await api.delete(`/mentor/conversations/${id}/`);
  },

  /**
   * Send a message and get a full (non-streaming) response.
   */
  async sendMessage(
    conversationId: number,
    content: string,
    codeContext = ''
  ): Promise<{ message: ChatMessage; hint_level: number }> {
    const r = await api.post(`/mentor/conversations/${conversationId}/message/`, {
      content,
      code_context: codeContext,
    });
    return r.data;
  },

  /**
   * Stream a message response using SSE (EventSource-like fetch).
   * Calls onChunk for each token, onDone when complete.
   */
  async sendMessageStream(
    conversationId: number,
    content: string,
    codeContext: string,
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (err: string) => void
  ): Promise<void> {
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/mentor/conversations/${conversationId}/message/?stream=true`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ content, code_context: codeContext }),
        }
      );

      if (!response.ok || !response.body) {
        onError('Failed to get streaming response from server.');
        return;
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last partial line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              onDone();
              return;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.chunk !== undefined) {
                onChunk(parsed.chunk);
              }
            } catch (e) {
              // Ignore partial or unparseable JSON
            }
          }
        }
      }
      onDone();
    } catch (err) {
      onError('Streaming connection failed.');
    }
  },

  /** Escalate hint level (1→2→...→5) */
  async escalateHint(conversationId: number): Promise<{
    hint_level: number;
    hint_prompt: string;
    message: string;
  }> {
    const r = await api.post(`/mentor/conversations/${conversationId}/hint/`);
    return r.data;
  },

  /** Check Ollama health */
  async checkHealth(): Promise<{ ollama_online: boolean; message: string }> {
    const r = await api.get('/mentor/health/');
    return r.data;
  },
};
