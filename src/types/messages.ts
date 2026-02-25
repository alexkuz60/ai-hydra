// Common types for messages and attachments
// Note: MessageRole is defined in src/config/roles.ts as the single source of truth

import { ToolCall, ToolResult } from './tools';
import type { MessageRole } from '@/config/roles';
import type { Proposal } from './patterns';

// Re-export MessageRole for backward compatibility
export type { MessageRole };

export interface Attachment {
  name: string;
  url: string;
  type: string;
  // Inline content for Mermaid diagrams (not uploaded to storage)
  content?: string;
}

export type ProviderGateway = 'lovable_ai' | 'proxyapi' | 'openrouter' | 'deepseek' | 'mistral' | 'groq' | 'gemini';

export interface ProviderInfo {
  gateway: ProviderGateway;
  fallback_from?: ProviderGateway;
  fallback_reason?: string;
}

export interface MessageMetadata {
  attachments?: Attachment[];
  rating?: number;
  // Tool calling support
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
  // Fallback indicator - when model was rate-limited and used orchestrator
  used_fallback?: boolean;
  fallback_reason?: 'rate_limit' | 'error' | 'unsupported';
  // Provider gateway tracking
  provider_info?: ProviderInfo;
  // Supervisor approval proposals
  proposals?: Proposal[];
  // Interactive checklists
  interactive_checklists?: boolean;
  checklist_state?: Record<number, boolean>;
  // User Likert rating (0-5 scale)
  user_likert?: number;
  [key: string]: unknown;
}

export interface Message {
  id: string;
  session_id: string;
  role: MessageRole;
  model_name: string | null;
  content: string;
  reasoning_path: string | null;
  reasoning_translated: string | null;
  confidence_score: number | null;
  created_at: string;
  content_en?: string | null;
  metadata?: MessageMetadata | unknown;
  // Decision Graph fields (Phase 1)
  parent_message_id?: string | null;
  request_group_id?: string | null;
}

// Link types for the decision graph
export type MessageLinkType =
  | 'reply'
  | 'critique'
  | 'evaluation'
  | 'forward_to_dchat'
  | 'return_from_dchat'
  | 'summary_of';

export interface MessageLink {
  id: string;
  source_message_id: string;
  target_message_id: string;
  link_type: MessageLinkType;
  weight: number | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// Graph node for Navigator tree rendering
export interface MessageGraphNode {
  message: Message;
  children: MessageGraphNode[];
  links: MessageLink[];
  depth: number;
  pathScore: number | null;
}
