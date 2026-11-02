/**
 * Projects API Service — ZIP Uploads and Evolution Analysis
 */
import api from './api';

export interface FileAnalysis {
  id: number;
  file_path: string;
  content: string;
  feedback: string;
  score: number;
}

export interface ProjectVersion {
  id: number;
  version_num: number;
  quality_score: number | null;
  summary_feedback: string;
  created_at: string;
  file_analyses: FileAnalysis[];
}

export interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  latest_version?: ProjectVersion;
  version_count: number;
}

export interface ProjectDetail extends Project {
  versions: ProjectVersion[];
}

export const projectsService = {
  /** List all projects for user */
  async getProjects(): Promise<Project[]> {
    const r = await api.get<Project[]>('/projects/');
    return Array.isArray(r.data) ? r.data : (r.data as any).results ?? [];
  },

  /** Get specific project with all version history */
  async getProjectDetail(id: number): Promise<ProjectDetail> {
    const r = await api.get<ProjectDetail>(`/projects/${id}/`);
    return r.data;
  },

  /** Create a new empty project container */
  async createProject(name: string, description: string = ''): Promise<Project> {
    const r = await api.post<Project>('/projects/', { name, description });
    return r.data;
  },

  /** Upload a ZIP file to generate a new ProjectVersion and AI analysis */
  async uploadVersion(projectId: number, file: File): Promise<ProjectVersion> {
    const formData = new FormData();
    formData.append('file', file);

    const r = await api.post<ProjectVersion>(
      `/projects/${projectId}/versions/`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        // Timeout could be long for AI analysis
        timeout: 120000 
      }
    );
    return r.data;
  }
};
