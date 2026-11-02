/**
 * Assessment API Service — problems, test cases, and submissions
 */
import api from './api';

export interface TestCase {
  id: number;
  input_data: string;
  expected_output: string;
  is_hidden: boolean;
  order: number;
}

export interface Problem {
  id: number;
  title: string;
  slug: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  concept: number;
  concept_name: string;
  starter_code: string;
  test_cases: TestCase[];
}

export interface SubmissionResult {
  submission_id: number;
  passed: boolean;
  mastery_state: string;
  mastery_score: number;
}

export const assessmentService = {
  /** List all problems */
  async getProblems(conceptId?: number): Promise<Problem[]> {
    const params = conceptId ? { concept: conceptId } : {};
    const r = await api.get<Problem[]>('/assessments/problems/', { params });
    return Array.isArray(r.data) ? r.data : (r.data as any).results ?? [];
  },

  /** Get details for a single problem */
  async getProblem(id: number): Promise<Problem> {
    const r = await api.get<Problem>(`/assessments/problems/${id}/`);
    return r.data;
  },

  /** Submit code result */
  async submitCode(
    problemId: number, 
    code: string, 
    passed: boolean, 
    errorMessage = ''
  ): Promise<SubmissionResult> {
    const r = await api.post<SubmissionResult>(`/assessments/problems/${problemId}/submit/`, {
      code,
      passed,
      error_message: errorMessage,
    });
    return r.data;
  }
};
