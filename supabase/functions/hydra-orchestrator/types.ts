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

export interface RequestBody {
  session_id: string;
  message: string;
  attachments?: Attachment[];
  models: ModelRequest[];
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
}
