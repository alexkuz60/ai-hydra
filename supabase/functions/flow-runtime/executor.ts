// ============================================
// Flow Executor - Orchestrates node execution
// ============================================

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { 
  FlowNode, 
  FlowEdge, 
  NodeState, 
  NodeExecution, 
  FlowExecutionState,
  SSEEvent,
  NodeRunnerContext,
} from "./types.ts";
import { createExecutionPlan, getNodeInputs, ExecutionPlan } from "./scheduler.ts";
import { getNodeRunner, runCheckpointNode } from "./runners.ts";

export interface ExecutorConfig {
  supabaseUrl: string;
  supabaseKey: string;
  lovableApiKey: string;
  userId: string;
  sessionId: string;
}

export interface ExecutorResult {
  success: boolean;
  output?: unknown;
  error?: string;
  waitingForCheckpoint?: {
    nodeId: string;
    message: string;
  };
}

/**
 * Main Flow Executor class
 * Manages the lifecycle of flow execution with SSE streaming
 */
export class FlowExecutor {
  private nodes: FlowNode[];
  private edges: FlowEdge[];
  private flowId: string;
  private config: ExecutorConfig;
  private plan: ExecutionPlan;
  private nodeStates: Map<string, NodeExecution>;
  private nodeOutputs: Map<string, unknown>;
  private context: Record<string, unknown>;
  private sendSSE: (event: SSEEvent) => void;
  private supabaseClient: SupabaseClient;

  constructor(
    flowId: string,
    nodes: FlowNode[],
    edges: FlowEdge[],
    config: ExecutorConfig,
    sendSSE: (event: SSEEvent) => void
  ) {
    this.flowId = flowId;
    this.nodes = nodes;
    this.edges = edges;
    this.config = config;
    this.sendSSE = sendSSE;
    this.plan = createExecutionPlan(nodes, edges);
    this.nodeStates = new Map();
    this.nodeOutputs = new Map();
    this.context = {};
    
    // Create Supabase client for database/storage operations
    this.supabaseClient = createClient(config.supabaseUrl, config.supabaseKey);

    // Initialize all nodes as pending
    for (const node of nodes) {
      this.nodeStates.set(node.id, {
        nodeId: node.id,
        state: 'pending',
      });
    }
  }

  /**
   * Set initial context (input data, checkpoint responses, etc.)
   */
  setContext(context: Record<string, unknown>) {
    this.context = { ...this.context, ...context };
  }

  /**
   * Resume execution from a checkpoint with user response
   */
  setCheckpointResponse(nodeId: string, approved: boolean, userInput?: string) {
    this.context[`checkpoint_${nodeId}`] = { approved, user_input: userInput };
  }

  /**
   * Execute the entire flow
   */
  async execute(): Promise<ExecutorResult> {
    this.emitEvent('flow_start', undefined, { 
      totalNodes: this.nodes.length,
      layers: this.plan.layers.length,
    });

    try {
      // Execute layer by layer
      for (let layerIndex = 0; layerIndex < this.plan.layers.length; layerIndex++) {
        const layer = this.plan.layers[layerIndex];
        
        // Execute all nodes in this layer in parallel
        const results = await Promise.all(
          layer.map((nodeId: string) => this.executeNode(nodeId))
        );

        // Check for failures or checkpoints
        for (const result of results) {
          if (!result.success) {
            this.emitEvent('flow_error', undefined, { error: result.error });
            return { success: false, error: result.error };
          }

          if (result.waitingForCheckpoint) {
            this.emitEvent('flow_complete', undefined, { 
              status: 'waiting_user',
              checkpoint: result.waitingForCheckpoint,
            });
            return { 
              success: true, 
              waitingForCheckpoint: result.waitingForCheckpoint,
            };
          }
        }
      }

      // Collect final outputs from exit nodes
      const exitNodes = this.nodes.filter(node => 
        !this.edges.some(edge => edge.source === node.id)
      );
      
      const outputs: Record<string, unknown> = {};
      for (const node of exitNodes) {
        outputs[node.id] = this.nodeOutputs.get(node.id);
      }

      this.emitEvent('flow_complete', undefined, { 
        status: 'completed',
        outputs,
      });

      return { 
        success: true, 
        output: Object.keys(outputs).length === 1 ? Object.values(outputs)[0] : outputs,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emitEvent('flow_error', undefined, { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Execute a single node
   */
  private async executeNode(nodeId: string): Promise<{
    success: boolean;
    error?: string;
    waitingForCheckpoint?: { nodeId: string; message: string };
  }> {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) {
      return { success: false, error: `Node ${nodeId} not found` };
    }

    const nodeExecution = this.nodeStates.get(nodeId)!;

    // Skip if already completed (resume scenario)
    if (nodeExecution.state === 'completed') {
      return { success: true };
    }

    // Mark as running
    nodeExecution.state = 'running';
    nodeExecution.startedAt = new Date().toISOString();
    this.emitEvent('node_start', nodeId, { type: node.type, label: node.data.label });

    // Get inputs from connected nodes
    const inputs = getNodeInputs(nodeId, this.edges, this.nodeOutputs);

    // Check if this is a checkpoint-type condition
    const isCheckpoint = node.type === 'condition' && 
      (node.data.requiresApproval || node.data.isCheckpoint);

    // Get the appropriate runner
    const runner = isCheckpoint ? runCheckpointNode : getNodeRunner(node.type);

    if (!runner) {
      // For unsupported node types, pass through inputs
      console.warn(`[flow-runtime] No runner for node type: ${node.type}, passing through`);
      nodeExecution.state = 'completed';
      nodeExecution.completedAt = new Date().toISOString();
      this.nodeOutputs.set(nodeId, Object.values(inputs)[0] || null);
      this.emitEvent('node_complete', nodeId, { passthrough: true });
      return { success: true };
    }

    // Build runner context
    const runnerContext: NodeRunnerContext = {
      node,
      inputs,
      flowContext: this.context,
      userId: this.config.userId,
      sessionId: this.config.sessionId,
      supabaseUrl: this.config.supabaseUrl,
      supabaseKey: this.config.supabaseKey,
      lovableApiKey: this.config.lovableApiKey,
      supabaseClient: this.supabaseClient,
      sendEvent: (event) => this.emitEvent(event.type, event.nodeId, event.data),
    };

    try {
      const result = await runner(runnerContext);

      if (!result.success) {
        nodeExecution.state = 'failed';
        nodeExecution.error = result.error;
        this.emitEvent('node_error', nodeId, { error: result.error });
        return { success: false, error: result.error };
      }

      if (result.waitForUser) {
        nodeExecution.state = 'waiting_user';
        return { 
          success: true, 
          waitingForCheckpoint: { 
            nodeId, 
            message: result.checkpointMessage || 'Waiting for user input' 
          },
        };
      }

      // Success
      nodeExecution.state = 'completed';
      nodeExecution.completedAt = new Date().toISOString();
      nodeExecution.output = result.output;
      this.nodeOutputs.set(nodeId, result.output);

      this.emitEvent('node_complete', nodeId, { 
        outputPreview: String(result.output || '').slice(0, 100),
      });

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      nodeExecution.state = 'failed';
      nodeExecution.error = errorMessage;
      this.emitEvent('node_error', nodeId, { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Emit an SSE event
   */
  private emitEvent(
    type: SSEEvent['type'],
    nodeId: string | undefined,
    data: unknown
  ) {
    this.sendSSE({
      type,
      flowId: this.flowId,
      nodeId,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get current execution state for persistence
   */
  getState(): FlowExecutionState {
    const hasWaiting = Array.from(this.nodeStates.values())
      .some(n => n.state === 'waiting_user');
    const hasFailed = Array.from(this.nodeStates.values())
      .some(n => n.state === 'failed');
    const allCompleted = Array.from(this.nodeStates.values())
      .every(n => n.state === 'completed' || n.state === 'skipped');

    let status: FlowExecutionState['status'] = 'running';
    if (hasWaiting) status = 'waiting_user';
    else if (hasFailed) status = 'failed';
    else if (allCompleted) status = 'completed';

    return {
      flowId: this.flowId,
      sessionId: this.config.sessionId,
      userId: this.config.userId,
      status,
      nodes: this.nodeStates,
      context: this.context,
      startedAt: new Date().toISOString(),
    };
  }
}
