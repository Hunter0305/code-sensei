/**
 * Adaptive Roadmap API Service
 */
import api from '../lib/api';

export interface RoadmapNode {
  id: number;
  concept_id: number;
  concept_name: string;
  concept_difficulty?: number;
  order: number;
  ai_rationale: string;
  estimated_hours: number;
  status: 'pending' | 'in_progress' | 'completed';
  title?: string;
  description?: string;
  estimated_time?: string;
}

export interface LearningRoadmap {
  id: number;
  title: string;
  goal: string;
  is_active: boolean;
  created_at: string;
  nodes: RoadmapNode[];
  steps?: RoadmapNode[];
  progress_percentage?: number;
  total_steps?: number;
  completed_steps?: number;
}

export const roadmapService = {
  /** Get the user's active roadmap */
  async getActiveRoadmap(): Promise<LearningRoadmap | null> {
    try {
      const r = await api.get<LearningRoadmap>('/adaptive/roadmap/active/');
      return r.data;
    } catch (err: any) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  },

  /** Generate a new roadmap with Ollama / curriculum */
  async generateRoadmap(goal?: string): Promise<LearningRoadmap> {
    const r = await api.post<LearningRoadmap>('/adaptive/roadmap/generate/', { 
      goal: goal || 'Master Python & Data Structures' 
    });
    return r.data;
  },

  /** Update status of a roadmap node ('pending' | 'in_progress' | 'completed') */
  async updateNodeStatus(nodeId: number, status: 'pending' | 'in_progress' | 'completed'): Promise<LearningRoadmap> {
    const r = await api.patch<LearningRoadmap>(`/adaptive/roadmap/nodes/${nodeId}/status/`, { status });
    return r.data;
  }
};
