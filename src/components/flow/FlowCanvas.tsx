import React, { useCallback, useRef } from 'react';
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

import { InputNode } from './nodes/InputNode';
import { OutputNode } from './nodes/OutputNode';
import { PromptNode } from './nodes/PromptNode';
import { ModelNode } from './nodes/ModelNode';
import { ConditionNode } from './nodes/ConditionNode';
import { ToolNode } from './nodes/ToolNode';
import { FlowNodeType } from '@/types/flow';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

const nodeTypes = {
  input: InputNode,
  output: OutputNode,
  prompt: PromptNode,
  model: ModelNode,
  condition: ConditionNode,
  tool: ToolNode,
} as const;

interface FlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onInit: (instance: ReactFlowInstance) => void;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
  onPaneClick?: () => void;
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
  onPaneClick,
}: FlowCanvasProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
            },
          },
          eds
        )
      );
    },
    [setEdges]
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
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={onInit}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
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
