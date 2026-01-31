// ============================================
// Central type definitions for Hydra app
// ============================================

// Re-export all types for convenient imports
export * from './messages';
export * from './tools';
export * from './flow';

// ============================================
// Common UI Types
// ============================================

/** User display information for chat messages */
export interface UserDisplayInfo {
  displayName: string | null;
  isSupervisor: boolean;
}

/** File attached to a message */
export interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
}

/** Upload progress state */
export interface UploadProgress {
  current: number;
  total: number;
}

// ============================================
// Session & Model Types
// ============================================

/** Per-model settings configuration */
export interface PerModelSettings {
  [modelId: string]: {
    role: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    tools?: string[];
  };
}

/** Session configuration stored in DB */
export interface SessionConfig {
  selectedModels?: string[];
  perModelSettings?: PerModelSettings;
}

/** Task/Session entity */
export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  session_config: SessionConfig | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// D-Chat / Consultant Types
// ============================================

/** Consultant operation modes */
export type ConsultantMode = 'web_search' | 'expert' | 'critic' | 'arbiter' | 'moderator';

/** Source message for moderator context */
export interface SourceMessage {
  role: string;
  model_name: string | null;
  content: string;
}

/** D-Chat context from navigator */
export interface DChatContext {
  messageId: string;
  content: string;
  sourceMessages?: SourceMessage[];
}
