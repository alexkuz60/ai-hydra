// ============================================
// DAG Scheduler for Flow Execution
// ============================================

import { FlowNode, FlowEdge, DAGNode, ExecutionPlan } from "./types.ts";

export type { ExecutionPlan };

/**
 * Builds a Directed Acyclic Graph from flow nodes and edges
 */
export function buildDAG(nodes: FlowNode[], edges: FlowEdge[]): Map<string, DAGNode> {
  const graph = new Map<string, DAGNode>();

  // Initialize all nodes
  for (const node of nodes) {
    graph.set(node.id, {
      id: node.id,
      type: node.type,
      data: node.data,
      dependencies: [],
      dependents: [],
    });
  }

  // Build dependency relationships from edges
  for (const edge of edges) {
    const sourceNode = graph.get(edge.source);
    const targetNode = graph.get(edge.target);

    if (sourceNode && targetNode) {
      // Target depends on source
      targetNode.dependencies.push(edge.source);
      // Source has target as dependent
      sourceNode.dependents.push(edge.target);
    }
  }

  return graph;
}

/**
 * Performs topological sort and groups nodes into execution layers
 * Nodes within the same layer can be executed in parallel
 */
export function createExecutionPlan(nodes: FlowNode[], edges: FlowEdge[]): ExecutionPlan {
  const graph = buildDAG(nodes, edges);
  const layers: string[][] = [];
  const visited = new Set<string>();
  const remaining = new Set(graph.keys());

  while (remaining.size > 0) {
    const currentLayer: string[] = [];

    // Find all nodes whose dependencies are satisfied
    for (const nodeId of remaining) {
      const node = graph.get(nodeId)!;
      const allDepsSatisfied = node.dependencies.every(dep => visited.has(dep));

      if (allDepsSatisfied) {
        currentLayer.push(nodeId);
      }
    }

    // If no nodes can be executed, we have a cycle
    if (currentLayer.length === 0 && remaining.size > 0) {
      throw new Error("Circular dependency detected in flow diagram");
    }

    // Mark current layer as visited and remove from remaining
    for (const nodeId of currentLayer) {
      visited.add(nodeId);
      remaining.delete(nodeId);
    }

    if (currentLayer.length > 0) {
      layers.push(currentLayer);
    }
  }

  return { layers, graph };
}

/**
 * Gets the input edges for a node (which nodes feed into it)
 * Handles special case of Split node outputs (output-1, output-2, etc.)
 */
export function getNodeInputs(
  nodeId: string,
  edges: FlowEdge[],
  nodeOutputs: Map<string, unknown>
): Record<string, unknown> {
  const inputs: Record<string, unknown> = {};

  for (const edge of edges) {
    if (edge.target === nodeId) {
      const sourceOutput = nodeOutputs.get(edge.source);
      
      // Handle Split node outputs - sourceOutput is an object with output-1, output-2, etc.
      if (sourceOutput && typeof sourceOutput === 'object' && !Array.isArray(sourceOutput)) {
        const sourceHandle = edge.sourceHandle || 'default';
        const outputMap = sourceOutput as Record<string, unknown>;
        
        // If the source handle matches a key in the output map, use that specific output
        if (sourceHandle in outputMap) {
          const handleKey = edge.targetHandle || sourceHandle || 'default';
          inputs[handleKey] = outputMap[sourceHandle];
          continue;
        }
      }
      
      // Default behavior
      const handleKey = edge.targetHandle || edge.sourceHandle || 'default';
      inputs[handleKey] = sourceOutput;
    }
  }

  return inputs;
}

/**
 * Finds the entry nodes (nodes with no dependencies)
 */
export function findEntryNodes(graph: Map<string, DAGNode>): string[] {
  const entryNodes: string[] = [];

  for (const [nodeId, node] of graph) {
    if (node.dependencies.length === 0) {
      entryNodes.push(nodeId);
    }
  }

  return entryNodes;
}

/**
 * Finds the exit nodes (nodes with no dependents)
 */
export function findExitNodes(graph: Map<string, DAGNode>): string[] {
  const exitNodes: string[] = [];

  for (const [nodeId, node] of graph) {
    if (node.dependents.length === 0) {
      exitNodes.push(nodeId);
    }
  }

  return exitNodes;
}
