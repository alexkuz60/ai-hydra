// ── Interview Types ──
// Centralized types for the Interview system (Phase 1-3)

/** A single test step in the interview pipeline */
export interface InterviewTestStep {
  step_index: number;
  task_type: string;
  competency: string;
  task_prompt: string;
  baseline: { current_value: string } | null;
  candidate_output: { proposed_value: string } | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string | null;
  elapsed_ms: number;
  token_count: number;
}

/** Aggregated test results stored in interview_sessions.test_results JSONB */
export interface InterviewTestResults {
  steps: InterviewTestStep[];
  total_steps: number;
  completed_steps: number;
  started_at: string;
  completed_at: string | null;
}

/** Hydrated interview session row */
export interface InterviewSession {
  id: string;
  role: string;
  candidate_model: string;
  status: string;
  briefing_data: Record<string, unknown> | null;
  briefing_token_count: number | null;
  test_results: InterviewTestResults | null;
  verdict: Record<string, unknown> | null;
  config: Record<string, unknown> | null;
  source_contest_id: string | null;
  created_at: string;
}

/** Live step status tracked during SSE streaming */
export interface StepStatus {
  status: string;
  elapsed_ms?: number;
  token_count?: number;
  error?: string;
}

// ── Role Test Plugin Interface ──
// Each technical role implements this to provide role-specific test tasks

/** Context available to the plugin for generating tasks */
export interface RoleTestContext {
  role: string;
  /** Role knowledge entries from role_knowledge table */
  knowledgeEntries: Array<{ content: string; category: string; source_title?: string }>;
  /** Role duties from ROLE_CONFIG */
  duties: string[];
  /** Existing prompts from prompt_library for this role */
  prompts: Array<{ name: string; content: string }>;
  /** Role memory entries */
  memories: Array<{ content: string; memory_type: string }>;
  /** Language preference */
  language: string;
}

/** A generated test task before execution */
export interface RoleTestTask {
  task_type: string;
  competency: string;
  task_prompt: string;
  /** Optional: fetch baseline from specific source */
  baseline_source?: {
    type: 'knowledge' | 'prompt' | 'memory' | 'config' | 'none';
    query?: string;
  };
}

/**
 * Plugin interface for role-specific interview test generation.
 * Each technical role (flowregulator, toolsmith, webhunter, etc.)
 * implements this to define its unique test pipeline.
 */
export interface RoleTestPlugin {
  /** Role identifier */
  role: string;
  /** Generate test tasks based on available context */
  generateTasks(context: RoleTestContext): RoleTestTask[];
  /** Optional: custom evaluation hint for the arbiter */
  getEvaluationHint?(competency: string): string;
}
