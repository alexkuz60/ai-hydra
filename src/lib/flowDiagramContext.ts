import type { Node, Edge } from '@xyflow/react';

/**
 * Serializes the current flow diagram state for the Logistics AI context.
 */
export interface FlowDiagramContext {
  name: string;
  nodes: SerializedNode[];
  edges: SerializedEdge[];
}

interface SerializedNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

interface SerializedEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  data?: Record<string, unknown>;
}

export function serializeFlowDiagram(
  name: string,
  nodes: Node[],
  edges: Edge[]
): FlowDiagramContext {
  return {
    name,
    nodes: nodes.map(n => ({
      id: n.id,
      type: n.type || 'unknown',
      data: n.data as Record<string, unknown>,
    })),
    edges: edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle ?? undefined,
      targetHandle: e.targetHandle ?? undefined,
      data: e.data as Record<string, unknown> | undefined,
    })),
  };
}
