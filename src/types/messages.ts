// Common types for messages and attachments

export type MessageRole = 'user' | 'assistant' | 'critic' | 'arbiter';

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export interface MessageMetadata {
  attachments?: Attachment[];
  rating?: number;
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
