import { useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import dagre from '@dagrejs/dagre';

export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL';

interface UseAutoLayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number;
  nodeSep?: number;
}

export function useAutoLayout(options: UseAutoLayoutOptions = {}) {
  const {
    nodeWidth = 200,
    nodeHeight = 80,
    rankSep = 80,
    nodeSep = 50,
  } = options;

  const getLayoutedElements = useCallback(
    (
      nodes: Node[],
      edges: Edge[],
      direction: LayoutDirection = 'LR'
    ): { nodes: Node[]; edges: Edge[] } => {
      if (nodes.length === 0) {
        return { nodes, edges };
      }

      const dagreGraph = new dagre.graphlib.Graph();
      dagreGraph.setDefaultEdgeLabel(() => ({}));

      const isHorizontal = direction === 'LR' || direction === 'RL';

      dagreGraph.setGraph({
        rankdir: direction,
        ranksep: rankSep,
        nodesep: nodeSep,
        marginx: 50,
        marginy: 50,
      });

      // Add nodes to dagre graph
      nodes.forEach((node) => {
        // Use custom dimensions based on node type
        let width = nodeWidth;
        let height = nodeHeight;

        // Circular nodes (input/output) need different sizing
        if (node.type === 'input' || node.type === 'output') {
          width = 120;
          height = 120;
        }

        dagreGraph.setNode(node.id, { width, height });
      });

      // Add edges to dagre graph
      edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
      });

      // Run layout algorithm
      dagre.layout(dagreGraph);

      // Get new node positions
      const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        
        // Dagre gives center position, we need top-left
        let width = nodeWidth;
        let height = nodeHeight;
        if (node.type === 'input' || node.type === 'output') {
          width = 120;
          height = 120;
        }

        return {
          ...node,
          position: {
            x: nodeWithPosition.x - width / 2,
            y: nodeWithPosition.y - height / 2,
          },
          // Update source/target position hints for better edge routing
          sourcePosition: isHorizontal ? 'right' : 'bottom',
          targetPosition: isHorizontal ? 'left' : 'top',
        };
      });

      return { nodes: layoutedNodes as Node[], edges };
    },
    [nodeWidth, nodeHeight, rankSep, nodeSep]
  );

  return { getLayoutedElements };
}
