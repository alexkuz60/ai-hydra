import type { AgentRole } from '@/config/roles';

export interface PendingResponseState {
  modelId: string;
  modelName: string;
  role: AgentRole;
  status: 'sent' | 'confirmed' | 'waiting';
  startTime: number;
  elapsedSeconds: number;
}

export interface RequestStartInfo {
  modelId: string;
  modelName: string;
  role: AgentRole;
}
