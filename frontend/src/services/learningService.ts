/**
 * Learning Service — API calls for Concept Graph and Mastery data
 */
import api from './api';

// ── Types (inline to avoid circular imports) ──────────────────

export interface ConceptNode {
  id: number;
  name: string;
  language: string;
  category: string;
  description: string;
  difficulty: number;
  graph_x: number;
  graph_y: number;
  // Mastery overlay
  mastery_score: number;
  confidence: number;
  mastery_state: 'not_started' | 'developing' | 'weak' | 'strong' | 'critical';
  needs_revision: boolean;
  attempts: number;
}

export interface GraphEdge {
  source: number;
  target: number;
}

export interface GraphStats {
  total: number;
  mastered: number;
  developing: number;
  weak: number;
  not_started: number;
  overall_mastery: number;
}

export interface GraphResponse {
  nodes: ConceptNode[];
  edges: GraphEdge[];
  stats: GraphStats;
  language: string;
}

export interface MasteryRecord {
  id: number;
  concept_id: number;
  concept_name: string;
  category: string;
  difficulty: number;
  mastery_score: number;
  confidence: number;
  mastery_state: string;
  attempts: number;
  successful_attempts: number;
  mistakes: number;
  repeated_mistakes: number;
  needs_revision: boolean;
  recent_mistake_tags: string[];
  last_studied: string | null;
  updated_at: string;
}

// ── Service ───────────────────────────────────────────────────

export const learningService = {
  /** Get full graph (nodes + edges + stats) for a language */
  async getGraph(language = 'python'): Promise<GraphResponse> {
    const response = await api.get<GraphResponse>('/learning/graph/', {
      params: { language },
    });
    return response.data;
  },

  /** Get all user mastery records */
  async getMastery(): Promise<MasteryRecord[]> {
    const response = await api.get<{ results: MasteryRecord[] }>('/learning/mastery/');
    return response.data.results ?? response.data as unknown as MasteryRecord[];
  },

  /** Get mastery for one concept */
  async getConceptMastery(conceptId: number): Promise<MasteryRecord> {
    const response = await api.get<MasteryRecord>(`/learning/mastery/${conceptId}/`);
    return response.data;
  },

  /** Record an attempt result — updates mastery automatically */
  async recordAttempt(
    conceptId: number,
    success: boolean,
    mistakeTags: string[] = []
  ): Promise<{ mastery: MasteryRecord; message: string }> {
    const response = await api.post(`/learning/mastery/${conceptId}/attempt/`, {
      success,
      mistake_tags: mistakeTags,
    });
    return response.data;
  },

  /** Get weak concepts (needs_revision=true) */
  async getWeakConcepts(): Promise<MasteryRecord[]> {
    const response = await api.get<{ results: MasteryRecord[] }>('/learning/weak-concepts/');
    return response.data.results ?? response.data as unknown as MasteryRecord[];
  },
};
