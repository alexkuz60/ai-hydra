// ============================================
// Type Definitions for hydra-orchestrator
// ============================================

// ============================================
// Tool Calling Types
// ============================================

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, {
        type: string;
        description?: string;
        enum?: string[];
      }>;
      required: string[];
    };
  };
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResult {
  tool_call_id: string;
  role: "tool";
  content: string;
}

// ============================================
// Custom Tool Types
// ============================================

export type ToolType = 'prompt' | 'http_api';

export interface HttpConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body_template?: string;
  response_path?: string;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  required: boolean;
}

export interface CustomToolDefinition {
  id: string;
  name: string;
  display_name: string;
  description: string;
  prompt_template: string;
  parameters: ToolParameter[];
  tool_type: ToolType;
  http_config: HttpConfig | null;
}

// ============================================
// Request/Response Types
// ============================================

/** Tool usage mode: always, auto (AI decides), or on_request (user asks) */
export type ToolUsageMode = 'always' | 'auto' | 'on_request';

/** Settings for a single tool including enabled state and usage mode */
export interface ToolSettings {
  enabled: boolean;
  usageMode: ToolUsageMode;
}

export interface ModelRequest {
  model_id: string;
  use_lovable_ai: boolean;
  provider?: string | null;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
  role?: 'assistant' | 'critic' | 'arbiter';
  enable_tools?: boolean;
  enabled_tools?: string[];
  enabled_custom_tools?: string[];
  /** Search provider for web_search tool: tavily, perplexity, or both */
  search_provider?: 'tavily' | 'perplexity' | 'both';
  /** Whether this role requires supervisor approval for proposals */
  requires_approval?: boolean;
  // Fallback metadata - passed when model was rate-limited or used orchestrator fallback
  fallback_metadata?: {
    used_fallback: boolean;
    fallback_reason: 'rate_limit' | 'error' | 'unsupported';
  };
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

/** A history message for multi-turn context */
export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RequestBody {
  session_id: string;
  message: string;
  attachments?: Attachment[];
  models: ModelRequest[];
  /** Conversation history for multi-turn context */
  history?: HistoryMessage[];
  /** Concept expert type tag — propagated to session_memory chunks */
  concept_type?: string;
  // HTTP tool testing action
  action?: 'test_http_tool';
  http_config?: HttpConfig;
  test_args?: Record<string, unknown>;
  tool_name?: string;
}

export interface DocumentText {
  name: string;
  text: string;
}

export interface ProcessedAttachments {
  images: Attachment[];
  documentTexts: DocumentText[];
  errors: { name: string; error: string }[];
}

// ============================================
// API Response Types
// ============================================

export interface UsageData {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface LovableAIResponse {
  model: string;
  provider: string;
  content: string;
  reasoning: string | null;
  usage: UsageData | null;
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
}

export interface PersonalModelResponse {
  model: string;
  provider: string;
  content: string;
  usage: UsageData | null;
}

export interface SuccessResult {
  model: string;
  provider: string;
  content: string;
  role: string;
  reasoning?: string | null;
  usage?: UsageData | null;
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
}

export interface ModelError {
  error: true;
  model: string;
  message: string;
}

export type ModelResult = SuccessResult | ModelError;

// ============================================
// HTTP Tool Execution Types
// ============================================

export interface HttpToolTestResult {
  success: boolean;
  result?: unknown;
  error?: string;
  warning?: string;
  full_response?: unknown;
  response_body?: string;
}

// ============================================
// Message Content Types (OpenAI-compatible)
// ============================================

export type ContentPart = 
  | { type: "text"; text: string } 
  | { type: "image_url"; image_url: { url: string } };

export type MessageItem = 
  | { role: "system"; content: string }
  | { role: "user"; content: string | ContentPart[] }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

// ============================================
// Calculator Types
// ============================================

export interface CalculatorArgs {
  expression: string;
}

export interface DatetimeArgs {
  timezone?: string;
  format?: "full" | "date" | "time" | "iso";
}

export interface WebSearchArgs {
  query: string;
  search_depth?: "basic" | "advanced";
  include_domains?: string;
  exclude_domains?: string;
  /** Search provider: tavily, perplexity, or both */
  provider?: "tavily" | "perplexity" | "both";
}

// ============================================
// Brief Prompt Engineer Types
// ============================================

export interface BriefPromptEngineerArgs {
  /** Описание задачи для Промпт-Инженера */
  task_description: string;
  /** Краткое резюме контекста из К-чата */
  context_summary?: string;
  /** Ограничения и требования */
  constraints?: string[];
  /** Целевая роль для генерации промпта */
  target_role?: string;
  /** Предпочтительный стиль промпта */
  style?: "concise" | "detailed" | "structured" | "creative";
}

// ============================================
// Search Provider Configuration
// ============================================

export interface SearchProviderConfig {
  tavilyKey: string | null;
  perplexityKey: string | null;
  /** Default provider from model settings */
  defaultProvider?: 'tavily' | 'perplexity' | 'both';
}

export type AvailableSearchProvider = "tavily" | "perplexity" | "both" | "none";

// ============================================
// Technical Staff Tool Args
// ============================================

/** Args for update_session_memory tool (Archivist) */
export interface UpdateSessionMemoryArgs {
  /** Text content to save to session memory */
  content: string;
  /** Type of memory chunk */
  chunk_type: "decision" | "context" | "instruction" | "summary";
  /** Importance level 1-10 (higher = more important) */
  importance?: number;
  /** Tags for categorization */
  tags?: string[];
}

/** Args for search_session_memory tool (Archivist) */
export interface SearchSessionMemoryArgs {
  /** Search query for semantic search */
  query: string;
  /** Filter by chunk types */
  chunk_types?: string[];
  /** Maximum number of results */
  limit?: number;
}

/** Args for validate_flow_diagram tool (Logistician) */
export interface ValidateFlowDiagramArgs {
  /** UUID of the flow diagram to validate */
  diagram_id: string;
  /** Validation level: syntax, logic, or optimization */
  validation_level?: "syntax" | "logic" | "optimization";
}

/** Args for save_role_experience tool (all technical roles) */
export interface SaveRoleExperienceArgs {
  /** Content describing the experience/insight */
  content: string;
  /** Type of memory: experience, preference, skill, mistake, or success */
  memory_type: "experience" | "preference" | "skill" | "mistake" | "success";
  /** Confidence score 0.0-1.0 */
  confidence?: number;
  /** Tags for categorization */
  tags?: string[];
}

/** Args for search_role_knowledge tool (technical roles) */
export interface SearchRoleKnowledgeArgs {
  /** Search query for semantic search in role knowledge base */
  query: string;
  /** Filter by categories */
  categories?: string[];
  /** Maximum number of results */
  limit?: number;
}

/** Args for patent_search tool (Patent Attorney) */
export interface PatentSearchArgs {
  /** Search query for patent databases */
  query: string;
  /** Jurisdiction: RU, US, EP, WO */
  jurisdiction?: string;
  /** Start year in YYYY format */
  date_from?: string;
}

// ============================================
// Tool Execution Context
// ============================================

/** Context passed to tool execution for session-aware tools */
export interface ToolExecutionContext {
  sessionId: string;
  userId: string;
  supabaseUrl: string;
  supabaseKey: string;
  /** Current role being used (for role-specific tools) */
  currentRole?: string;
  /** Concept type tag (visionary/strategist/patent) — passed from concept invocations */
  conceptType?: string;
}

// ============================================
// Reranking Types
// ============================================

/** A knowledge chunk candidate for reranking */
export interface KnowledgeChunkCandidate {
  id: string;
  content: string;
  source_title: string | null;
  category: string;
  similarity: number;
  hybrid_score?: number;
}

/** A knowledge chunk with reranking score applied */
export interface RankedKnowledgeChunk extends KnowledgeChunkCandidate {
  rerank_score: number;
  final_score: number;
}

// ============================================
// HyDE (Hypothetical Document Embeddings) Types
// ============================================

/** Configuration for HyDE search enhancement */
export interface HydeConfig {
  /** Weight of hypothetical document embedding (0.0–1.0). Query weight = 1 - hydeWeight */
  hydeWeight: number;
  /** Maximum tokens for hypothetical document generation */
  maxTokens: number;
}
