import type { MessageRole, AgentRole } from '@/config/roles';

// Pattern categories for strategic blueprints
export type PatternCategory = 'planning' | 'creative' | 'analysis' | 'technical';

// Communication tone options
export type CommunicationTone = 'formal' | 'friendly' | 'neutral' | 'provocative';

// Verbosity options
export type Verbosity = 'concise' | 'detailed' | 'adaptive';

// Stage definition for task blueprints
export interface BlueprintStage {
  name: string;
  roles: AgentRole[];
  objective: string;
  deliverables: string[];
}

// Checkpoint definition for task blueprints
export interface BlueprintCheckpoint {
  after_stage: number;
  condition: string;
}

// Strategic pattern - describes workflow for solving specific task types
export interface TaskBlueprint {
  id: string;
  name: string;
  category: PatternCategory;
  description: string;
  stages: BlueprintStage[];
  checkpoints: BlueprintCheckpoint[];
}

// Reaction trigger-behavior pair
export interface RoleReaction {
  trigger: string;
  behavior: string;
}

// Role interaction preferences
export interface RoleInteractions {
  defers_to: AgentRole[];
  challenges: AgentRole[];
  collaborates: AgentRole[];
}

// Communication style configuration
export interface CommunicationStyle {
  tone: CommunicationTone;
  verbosity: Verbosity;
  format_preference: string[];
}

// Role behavior pattern - describes communication style and reactions for a specific role
export interface RoleBehavior {
  id: string;
  role: AgentRole;
  communication: CommunicationStyle;
  reactions: RoleReaction[];
  interactions: RoleInteractions;
  requires_approval?: boolean;
}

// Proposal types for supervisor approval feature
export type ProposalPriority = 'high' | 'medium' | 'low';
export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'needs_clarification';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  priority?: ProposalPriority;
  status: ProposalStatus;
  comment?: string;
}

// Union type for any pattern
export type Pattern = TaskBlueprint | RoleBehavior;

// Type guard to check if pattern is TaskBlueprint
export function isTaskBlueprint(pattern: Pattern): pattern is TaskBlueprint {
  return 'stages' in pattern && 'category' in pattern;
}

// Type guard to check if pattern is RoleBehavior
export function isRoleBehavior(pattern: Pattern): pattern is RoleBehavior {
  return 'role' in pattern && 'communication' in pattern;
}
