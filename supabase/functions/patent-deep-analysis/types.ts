// Patent Deep Analysis — Types & Constants

export interface AnalysisConfig {
  /** Label for this config variant */
  label: string;
  max_tokens: number;
  temperature: number;
  /** Timeout in ms for idle (no data) detection */
  idle_timeout_ms?: number;
}

export interface AnalysisRequest {
  /** Interview session ID (for context loading) */
  session_id: string;
  /** Specific task index to deep-analyze (from test_results.steps) */
  step_index: number;
  /** Model to use */
  model_id: string;
  /** Parameter configurations to try */
  configs: AnalysisConfig[];
  /** Language */
  language?: string;
  /** If true, skip synthesis pass and just collect variants */
  collect_only?: boolean;
}

export interface VariantResult {
  config_label: string;
  config: AnalysisConfig;
  text: string;
  token_count: number;
  elapsed_ms: number;
  attempts: number;
  status: 'completed' | 'truncated' | 'failed';
  error?: string;
}

// ── Adaptive retry parameters ──
export const MAX_RETRIES = 3;
export const RETRY_ADJUSTMENTS = [
  { max_tokens_mult: 1.0, temperature_delta: 0 },
  { max_tokens_mult: 0.75, temperature_delta: -0.1 },
  { max_tokens_mult: 1.5, temperature_delta: 0 },
];

// ── Default configs for patent analysis ──
export const DEFAULT_CONFIGS: AnalysisConfig[] = [
  { label: 'precise', max_tokens: 4096, temperature: 0.3, idle_timeout_ms: 60_000 },
  { label: 'balanced', max_tokens: 6144, temperature: 0.5, idle_timeout_ms: 60_000 },
  { label: 'creative', max_tokens: 4096, temperature: 0.8, idle_timeout_ms: 60_000 },
  { label: 'devils_advocate', max_tokens: 6144, temperature: 0.4, idle_timeout_ms: 90_000 },
];
