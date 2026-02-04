// ============================================
// Flow Runtime Type Definitions
// ============================================

export type NodeState = 'pending' | 'ready' | 'running' | 'waiting_user' | 'completed' | 'failed' | 'skipped';

export interface FlowNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface FlowDiagram {
  id: string;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface NodeExecution {
  nodeId: string;
  state: NodeState;
  startedAt?: string;
  completedAt?: string;
  output?: unknown;
  error?: string;
}

export interface FlowExecutionState {
  flowId: string;
  sessionId: string;
  userId: string;
  status: 'running' | 'waiting_user' | 'completed' | 'failed';
  nodes: Map<string, NodeExecution>;
  context: Record<string, unknown>;
  startedAt: string;
  completedAt?: string;
}

// ============================================
// SSE Event Types
// ============================================

export interface SSEEvent {
  type: 'flow_start' | 'node_start' | 'node_progress' | 'node_complete' | 'node_error' | 'checkpoint' | 'flow_complete' | 'flow_error';
  flowId: string;
  nodeId?: string;
  data: unknown;
  timestamp: string;
}

// ============================================
// Request/Response Types
// ============================================

export interface FlowRuntimeRequest {
  action: 'start' | 'resume' | 'cancel' | 'checkpoint_response';
  flow_id: string;
  session_id: string;
  /** Initial input for the flow */
  input?: Record<string, unknown>;
  /** Response for checkpoint (when action = 'checkpoint_response') */
  checkpoint_data?: {
    node_id: string;
    approved: boolean;
    user_input?: string;
  };
}

// ============================================
// DAG Types
// ============================================

export interface DAGNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
  dependencies: string[];
  dependents: string[];
}

export interface ExecutionPlan {
  /** Nodes grouped by execution layer (parallel within layer) */
  layers: string[][];
  /** Full dependency graph */
  graph: Map<string, DAGNode>;
}

// ============================================
// Node Runner Types
// ============================================

export interface NodeRunnerContext {
  node: FlowNode;
  inputs: Record<string, unknown>;
  flowContext: Record<string, unknown>;
  userId: string;
  sessionId: string;
  supabaseUrl: string;
  supabaseKey: string;
  lovableApiKey: string;
  sendEvent: (event: Omit<SSEEvent, 'flowId' | 'timestamp'>) => void;
}

export interface NodeRunnerResult {
  success: boolean;
  output?: unknown;
  error?: string;
  /** If true, execution pauses and waits for user input */
  waitForUser?: boolean;
  checkpointMessage?: string;
}

export type NodeRunner = (ctx: NodeRunnerContext) => Promise<NodeRunnerResult>;
