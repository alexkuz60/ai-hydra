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

export interface MessageMetadata {
  attachments?: Attachment[];
  rating?: number;
  // Tool calling support
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
  // Fallback indicator - when model was rate-limited and used orchestrator
  used_fallback?: boolean;
  fallback_reason?: 'rate_limit' | 'error' | 'unsupported';
  // Supervisor approval proposals
  proposals?: Proposal[];
  // Interactive checklists
  interactive_checklists?: boolean;
  checklist_state?: Record<number, boolean>;
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
  metadata?: MessageMetadata | unknown;
}
