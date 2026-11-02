// ============================================================
// Code Sensei – TypeScript Type Definitions
// ============================================================

// ──────────────────────────────────────────────
// Auth & User
// ──────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  profile?: StudentProfile;
}

export interface StudentProfile {
  level: 'beginner' | 'intermediate' | 'advanced';
  learning_goal: string;
  preferred_language: string;
  streak: number;
  longest_streak: number;
  total_xp: number;
  last_active: string;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User & {
    level?: string;
    streak?: number;
    total_xp?: number;
  };
}

// ──────────────────────────────────────────────
// Learning Memory Graph
// ──────────────────────────────────────────────
export type MasteryState = 'strong' | 'developing' | 'weak' | 'critical' | 'not_started';

export interface Concept {
  id: number;
  name: string;
  language: string;
  category: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  parent_id: number | null;
}

export interface ConceptMastery {
  concept: Concept;
  mastery_score: number;        // 0-100
  confidence: number;           // 0-100
  attempts: number;
  successful_attempts: number;
  mistakes: number;
  repeated_mistakes: number;
  needs_revision: boolean;
  last_studied: string | null;
  mastery_state: MasteryState;
}

// ──────────────────────────────────────────────
// AI Mentor
// ──────────────────────────────────────────────
export type MentorType = 'professor' | 'senior_engineer' | 'debug_specialist' | 'interviewer';

export interface MentorConfig {
  type: MentorType;
  name: string;
  specialty: string;
  description: string;
  badge_color: string;
  avatar_initial: string;
}

export const MENTOR_CONFIGS: Record<MentorType, MentorConfig> = {
  professor: {
    type: 'professor',
    name: 'Professor',
    specialty: 'Concepts & Fundamentals',
    description: 'Explains programming concepts with patience and clarity',
    badge_color: 'purple',
    avatar_initial: 'P',
  },
  senior_engineer: {
    type: 'senior_engineer',
    name: 'Senior Engineer',
    specialty: 'Code Quality & Architecture',
    description: 'Reviews code with industry best practices',
    badge_color: 'blue',
    avatar_initial: 'S',
  },
  debug_specialist: {
    type: 'debug_specialist',
    name: 'Debug Specialist',
    specialty: 'Bug Hunting & Root Cause',
    description: 'Tracks down bugs and guides debugging',
    badge_color: 'red',
    avatar_initial: 'D',
  },
  interviewer: {
    type: 'interviewer',
    name: 'Interviewer',
    specialty: 'DSA & Mock Interviews',
    description: 'Conducts technical interview practice',
    badge_color: 'green',
    avatar_initial: 'I',
  },
};

// ──────────────────────────────────────────────
// Hint System
// ──────────────────────────────────────────────
export type HintLevel = 1 | 2 | 3 | 4 | 5;

export const HINT_LEVEL_LABELS: Record<HintLevel, string> = {
  1: 'Conceptual Hint',
  2: 'Direction / Approach',
  3: 'Pseudocode',
  4: 'Partial Solution',
  5: 'Complete Solution',
};

export interface HintResponse {
  level: HintLevel;
  content: string;
  next_level_available: boolean;
}

// ──────────────────────────────────────────────
// Coding Problems & Submissions
// ──────────────────────────────────────────────
export interface CodingProblem {
  id: number;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  language: string;
  concept_tags: string[];
  test_cases: TestCase[];
}

export interface TestCase {
  input: string;
  expected_output: string;
}

export interface Submission {
  id: number;
  problem: number;
  code: string;
  language: string;
  status: 'passed' | 'failed' | 'error' | 'partial';
  execution_output: string;
  hints_used: number;
  time_taken: number;
  score: number;
  created_at: string;
}

// ──────────────────────────────────────────────
// Projects
// ──────────────────────────────────────────────
export interface Project {
  id: number;
  name: string;
  description: string;
  language: string;
  latest_version: number;
  created_at: string;
}

export interface ProjectVersion {
  id: number;
  project: number;
  version_number: number;
  quality_score: number;
  analysis_result: ProjectAnalysisResult;
  created_at: string;
}

export interface ProjectAnalysisResult {
  file_count: number;
  line_count: number;
  language_breakdown: Record<string, number>;
  file_tree: FileTreeNode;
  overview: string;
  architecture: string;
  issues: ProjectIssue[];
  dependencies: string[];
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  language?: string;
  issue_count?: number;
  children?: FileTreeNode[];
}

export interface ProjectIssue {
  id: number;
  type: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  file_path: string;
  line_number: number | null;
  suggestion: string;
}

// ──────────────────────────────────────────────
// Adaptive Decision Engine
// ──────────────────────────────────────────────
export interface RLState {
  mastery_score: number;
  recent_mistakes: number;
  repeated_mistakes: number;
  confidence: number;
  hints_used_last_session: number;
  last_mentor_type: MentorType | null;
  consecutive_failures: number;
  days_since_revision: number;
}

export interface RLDecision {
  id: number;
  state: RLState;
  action: string;
  reward: number;
  outcome: Record<string, unknown>;
  created_at: string;
}

// ──────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────
export interface DashboardSummary {
  greeting: string;
  streak: number;
  total_xp: number;
  level: string;
  overall_mastery: number;
  weak_concepts_count: number;
  recent_activity_count: number;
}

// ──────────────────────────────────────────────
// API Response wrappers
// ──────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
