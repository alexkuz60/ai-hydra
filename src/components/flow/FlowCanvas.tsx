import React, { useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  addEdge,
  Connection,
  Node,
  Edge,
  ReactFlowInstance,
  ConnectionMode,
  MarkerType,
  OnNodesChange,
  OnEdgesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { NodeStatus } from '@/hooks/useFlowRuntime';

import { InputNode } from './nodes/InputNode';
import { OutputNode } from './nodes/OutputNode';
import { PromptNode } from './nodes/PromptNode';
import { ModelNode } from './nodes/ModelNode';
import { ConditionNode } from './nodes/ConditionNode';
import { ToolNode } from './nodes/ToolNode';
import { TransformNode } from './nodes/TransformNode';
import { FilterNode } from './nodes/FilterNode';
import { MergeNode } from './nodes/MergeNode';
import { SplitNode } from './nodes/SplitNode';
import { DatabaseNode } from './nodes/DatabaseNode';
import { ApiNode } from './nodes/ApiNode';
import { StorageNode } from './nodes/StorageNode';
import { LoopNode } from './nodes/LoopNode';
import { DelayNode } from './nodes/DelayNode';
import { SwitchNode } from './nodes/SwitchNode';
import { EmbeddingNode } from './nodes/EmbeddingNode';
import { MemoryNode } from './nodes/MemoryNode';
import { ClassifierNode } from './nodes/ClassifierNode';
import { GroupNode } from './nodes/GroupNode';
import { CustomEdge } from './edges/CustomEdge';
import { FlowNodeType } from '@/types/flow';
import { EdgeStyleSettings, FlowEdgeData } from '@/types/edgeTypes';
import { validateConnection, getSuggestedDataType } from './connectionRules';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const nodeTypes = {
  input: InputNode,
  output: OutputNode,
  prompt: PromptNode,
  model: ModelNode,
  condition: ConditionNode,
  tool: ToolNode,
  transform: TransformNode,
  filter: FilterNode,
  merge: MergeNode,
  split: SplitNode,
  database: DatabaseNode,
  api: ApiNode,
  storage: StorageNode,
  loop: LoopNode,
  delay: DelayNode,
  switch: SwitchNode,
  embedding: EmbeddingNode,
  memory: MemoryNode,
  classifier: ClassifierNode,
  group: GroupNode,
} as const;

const edgeTypes = {
  custom: CustomEdge,
} as const;

// Helper to get node className based on execution status
function getNodeStatusClassName(state: string): string {
  switch (state) {
    case 'running':
      return 'ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse';
    case 'completed':
      return 'ring-2 ring-green-500 ring-offset-2 ring-offset-background';
    case 'failed':
      return 'ring-2 ring-destructive ring-offset-2 ring-offset-background';
    case 'waiting_user':
      return 'ring-2 ring-amber-500 ring-offset-2 ring-offset-background animate-pulse';
    case 'skipped':
      return 'opacity-50';
    default:
      return '';
  }
}

interface FlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onInit: (instance: ReactFlowInstance) => void;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
  onEdgeClick?: (event: React.MouseEvent, edge: Edge) => void;
  onPaneClick?: () => void;
  edgeSettings: EdgeStyleSettings;
  nodeStatuses?: Map<string, NodeStatus>;
  nodeOutputs?: Map<string, unknown>;
}

export function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
  onInit,
  onNodeClick,
  onEdgeClick,
  onPaneClick,
  edgeSettings,
  nodeStatuses,
  nodeOutputs,
}: FlowCanvasProps) {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Enrich nodes with execution status for visual feedback
  const enrichedNodes = useMemo(() => {
    if (!nodeStatuses || nodeStatuses.size === 0) return nodes;
    
    return nodes.map(node => {
      const status = nodeStatuses.get(node.id);
      if (!status) return node;
      
      // Add status to node data for styling
      return {
        ...node,
        data: {
          ...node.data,
          executionStatus: status.state,
          executionProgress: status.progress,
          executionError: status.error,
        },
        // Add visual styling based on status
        className: getNodeStatusClassName(status.state),
      };
    });
  }, [nodes, nodeStatuses]);

  // Enrich edges with runtime data from completed nodes
  const enrichedEdges = useMemo(() => {
    if (!nodeOutputs || nodeOutputs.size === 0) return edges;
    
    return edges.map(edge => {
      // Get output data from the source node
      const sourceOutput = nodeOutputs.get(edge.source);
      
      if (sourceOutput === undefined) return edge;
      
      // Add runtime data to edge for tooltip visualization
      return {
        ...edge,
        data: {
          ...edge.data,
          runtimeData: sourceOutput,
        },
      };
    });
  }, [edges, nodeOutputs]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;

      // Find source and target nodes to get their types
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);

      if (!sourceNode || !targetNode) return;

      const sourceType = sourceNode.type as FlowNodeType;
      const targetType = targetNode.type as FlowNodeType;

      // Validate connection
      const validation = validateConnection(sourceType, targetType);

      if (!validation.isValid) {
        toast.error(language === 'ru' ? validation.reasonRu : validation.reason);
        return;
      }

      // Get suggested data type based on source
      const suggestedDataType = getSuggestedDataType(sourceType);

      // Build marker based on settings
      const markerEnd = edgeSettings.defaultMarkerType !== 'none' 
        ? {
            type: edgeSettings.defaultMarkerType === 'arrowclosed' 
              ? MarkerType.ArrowClosed 
              : MarkerType.Arrow,
            width: 20,
            height: 20,
          }
        : undefined;

      // Create edge with settings
      const edgeData: FlowEdgeData = {
        dataType: suggestedDataType,
        animated: edgeSettings.defaultAnimated,
        lineType: edgeSettings.defaultLineType,
        strokeWidth: 2,
      };

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'custom',
            animated: edgeSettings.defaultAnimated,
            markerEnd,
            data: edgeData,
          },
          eds
        )
      );
    },
    [setEdges, nodes, edgeSettings, language]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as FlowNodeType;
      if (!type) return;

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const getDefaultLabel = (nodeType: FlowNodeType): string => {
        return t(`flowEditor.nodes.${nodeType}`);
      };

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: getDefaultLabel(type) },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, t]
  );

  return (
    <div ref={reactFlowWrapper} className="flex-1 h-full">
      <ReactFlow
        nodes={enrichedNodes}
        edges={enrichedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={onInit}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          type: 'custom',
          animated: edgeSettings.defaultAnimated,
        }}
        proOptions={{ hideAttribution: true }}
        className="bg-background"
      >
        <Controls 
          className="!bg-card !border-border !rounded-lg !shadow-lg"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-card !border-border !rounded-lg"
          nodeColor={(node) => {
            switch (node.type) {
              case 'input': return 'hsl(var(--hydra-info))';
              case 'output': return 'hsl(var(--hydra-glow))';
              case 'prompt': return 'hsl(var(--primary))';
              case 'model': return 'hsl(var(--hydra-success))';
              case 'condition': return 'hsl(var(--hydra-warning))';
              case 'tool': return 'hsl(var(--hydra-expert))';
              case 'transform': return 'hsl(var(--hydra-analyst))';
              case 'filter': return 'hsl(var(--hydra-warning))';
              case 'merge': return 'hsl(var(--hydra-advisor))';
              case 'split': return 'hsl(var(--hydra-archivist))';
              case 'database': return 'hsl(var(--hydra-analyst))';
              case 'api': return 'hsl(var(--hydra-webhunter))';
              case 'storage': return 'hsl(var(--hydra-archivist))';
              case 'loop': return 'hsl(var(--hydra-moderator))';
              case 'delay': return 'hsl(var(--muted-foreground))';
              case 'switch': return 'hsl(var(--hydra-warning))';
              case 'embedding': return 'hsl(var(--hydra-expert))';
              case 'memory': return 'hsl(var(--hydra-advisor))';
              case 'classifier': return 'hsl(var(--hydra-success))';
              default: return 'hsl(var(--muted))';
            }
          }}
          maskColor={theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)'}
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={theme === 'dark' ? 'hsl(var(--border))' : 'hsl(var(--muted-foreground) / 0.2)'}
        />
      </ReactFlow>
    </div>
  );
}
