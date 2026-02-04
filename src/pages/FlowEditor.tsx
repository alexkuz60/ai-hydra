import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNodesState, useEdgesState, Node, Edge, ReactFlowInstance, ReactFlowProvider } from '@xyflow/react';
import { Layout } from '@/components/layout/Layout';
import { FlowCanvas } from '@/components/flow/FlowCanvas';
import { FlowSidebar } from '@/components/flow/FlowSidebar';
import { FlowToolbar, FlowHeaderActions } from '@/components/flow/FlowToolbar';
import { NodePropertiesPanel } from '@/components/flow/NodePropertiesPanel';
import { EdgePropertiesPanel } from '@/components/flow/EdgePropertiesPanel';
import { FlowExecutionPanel } from '@/components/flow/FlowExecutionPanel';
import { FlowCheckpointDialog } from '@/components/flow/FlowCheckpointDialog';
import { useFlowDiagrams, exportToMermaid } from '@/hooks/useFlowDiagrams';
import { useFlowExport } from '@/hooks/useFlowExport';
import { useFlowHistoryExtended, HistoryState } from '@/hooks/useFlowHistory';
import { useAutoLayout, LayoutDirection } from '@/hooks/useAutoLayout';
import { useFlowRuntime } from '@/hooks/useFlowRuntime';
import { FlowNodeType, FlowDiagram } from '@/types/flow';
import { EdgeStyleSettings, FlowEdgeData, DEFAULT_EDGE_SETTINGS } from '@/types/edgeTypes';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useSearchParams } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

// Load edge settings from localStorage
function loadEdgeSettings(): EdgeStyleSettings {
  try {
    const saved = localStorage.getItem('flowEditor.edgeSettings');
    if (saved) {
      return { ...DEFAULT_EDGE_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to load edge settings:', e);
  }
  return DEFAULT_EDGE_SETTINGS;
}

// Save edge settings to localStorage
function saveEdgeSettings(settings: EdgeStyleSettings) {
  try {
    localStorage.setItem('flowEditor.edgeSettings', JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save edge settings:', e);
  }
}

function FlowEditorContent() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const urlDiagramId = searchParams.get('id');
  const { diagrams, saveDiagram, deleteDiagram, isSaving, isLoading } = useFlowDiagrams();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [diagramName, setDiagramName] = useState(t('flowEditor.newDiagram'));
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [edgeSettings, setEdgeSettings] = useState<EdgeStyleSettings>(loadEdgeSettings);
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  // Flow runtime for execution
  const flowRuntime = useFlowRuntime({
    onComplete: (output) => {
      toast({
        title: t('flowEditor.executionComplete'),
        description: typeof output === 'string' ? output : JSON.stringify(output).slice(0, 100),
      });
    },
    onError: (error) => {
      toast({
        title: t('flowEditor.executionError'),
        description: error,
        variant: 'destructive',
      });
    },
    onCheckpoint: (nodeId, message) => {
      console.log('[FlowEditor] Checkpoint reached:', nodeId, message);
    },
  });

  // History for undo/redo
  const history = useFlowHistoryExtended({ maxHistory: 50 });
  const isUndoRedoAction = useRef(false);
  const lastStateRef = useRef<string>('');

  // Auto layout
  const { getLayoutedElements } = useAutoLayout();

  // Export hook
  const {
    exportPng,
    exportSvg,
    exportJson,
    exportYaml,
    exportPdf,
    copyToClipboard,
  } = useFlowExport({
    diagramName,
    nodes,
    edges,
    getViewport: () => reactFlowInstance.current?.getViewport(),
  });

  // Load diagram on mount - either from URL param or last saved
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (!isLoading && diagrams.length > 0 && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      
      // Check if we have a specific diagram ID from URL
      if (urlDiagramId) {
        const targetDiagram = diagrams.find(d => d.id === urlDiagramId);
        if (targetDiagram) {
          handleLoadDiagram(targetDiagram);
          return;
        }
      }
      
      // Otherwise load the last saved diagram
      const lastDiagram = diagrams[0];
      handleLoadDiagram(lastDiagram);
    }
  }, [isLoading, diagrams, urlDiagramId]);

  // Track changes and push to history
  useEffect(() => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }

    // Create a state signature to detect actual changes
    const stateSignature = JSON.stringify({ nodes, edges });
    if (stateSignature === lastStateRef.current) {
      return;
    }

    // Only push if we have a previous state (skip initial load)
    if (lastStateRef.current) {
      const previousState: HistoryState = JSON.parse(lastStateRef.current);
      history.pushState(previousState);
      setHasChanges(true);
    }

    lastStateRef.current = stateSignature;
  }, [nodes, edges, history]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ctrl+Z = Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      
      // Ctrl+Shift+Z or Ctrl+Y = Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, edges]);

  const handleUndo = useCallback(() => {
    const previousState = history.undo();
    if (previousState) {
      // Save current state to redo stack
      history.pushToRedo({ nodes, edges });
      
      isUndoRedoAction.current = true;
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
      lastStateRef.current = JSON.stringify(previousState);
    }
  }, [history, nodes, edges, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    const nextState = history.redo();
    if (nextState) {
      // Save current state to undo stack
      history.pushState({ nodes, edges });
      
      isUndoRedoAction.current = true;
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      lastStateRef.current = JSON.stringify(nextState);
    }
  }, [history, nodes, edges, setNodes, setEdges]);

  // Save edge settings when they change
  const handleEdgeSettingsChange = useCallback((newSettings: EdgeStyleSettings) => {
    setEdgeSettings(newSettings);
    saveEdgeSettings(newSettings);
  }, []);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);

  const onDragStart = useCallback((event: React.DragEvent, nodeType: FlowNodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleSave = useCallback(async () => {
    if (!user) return;

    const viewport = reactFlowInstance.current?.getViewport() || { x: 0, y: 0, zoom: 1 };

    await saveDiagram({
      id: currentDiagramId || undefined,
      name: diagramName,
      nodes: nodes as any,
      edges,
      viewport,
      user_id: user.id,
    });

    setHasChanges(false);
  }, [currentDiagramId, diagramName, nodes, edges, saveDiagram, user]);

  const handleNew = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setDiagramName(t('flowEditor.newDiagram'));
    setCurrentDiagramId(null);
    setHasChanges(false);
    setSelectedNode(null);
    setSelectedEdge(null);
    history.clear();
    lastStateRef.current = JSON.stringify({ nodes: [], edges: [] });
  }, [setNodes, setEdges, t, history]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const handleEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const handleUpdateNode = useCallback((nodeId: string, data: Record<string, unknown>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data } : node
      )
    );
    setSelectedNode((prev) =>
      prev?.id === nodeId ? { ...prev, data } : prev
    );
  }, [setNodes]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  }, [setNodes, setEdges]);

  const handleUpdateEdge = useCallback((edgeId: string, data: FlowEdgeData) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId ? { ...edge, data } : edge
      )
    );
    setSelectedEdge((prev) =>
      prev?.id === edgeId ? { ...prev, data } : prev
    );
  }, [setEdges]);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
    setSelectedEdge(null);
  }, [setEdges]);

  const handleLoadDiagram = useCallback((diagram: FlowDiagram) => {
    setNodes(diagram.nodes as Node[]);
    setEdges(diagram.edges);
    setDiagramName(diagram.name);
    setCurrentDiagramId(diagram.id);
    setHasChanges(false);
    setSelectedNode(null);
    setSelectedEdge(null);
    history.clear();
    lastStateRef.current = JSON.stringify({ nodes: diagram.nodes, edges: diagram.edges });

    if (diagram.viewport && reactFlowInstance.current) {
      reactFlowInstance.current.setViewport(diagram.viewport);
    }
  }, [setNodes, setEdges, history]);

  const handleGenerateMermaid = useCallback(() => {
    return exportToMermaid(nodes, edges);
  }, [nodes, edges]);

  const handleAutoLayout = useCallback((direction: LayoutDirection) => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      direction
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    // Fit view after layout
    setTimeout(() => {
      reactFlowInstance.current?.fitView({ padding: 0.2 });
    }, 50);
  }, [nodes, edges, getLayoutedElements, setNodes, setEdges]);

  // Flow execution handlers
  const canExecute = useMemo(() => {
    return currentDiagramId !== null && nodes.length > 0;
  }, [currentDiagramId, nodes.length]);

  const handleStartExecution = useCallback(async () => {
    if (!currentDiagramId) {
      toast({
        title: t('flowEditor.saveFirst'),
        description: t('flowEditor.saveFirstDescription'),
        variant: 'destructive',
      });
      return;
    }

    // Generate a unique session ID for this execution
    const executionSessionId = `flow-exec-${Date.now()}`;
    setShowExecutionPanel(true);
    
    await flowRuntime.startFlow(currentDiagramId, executionSessionId);
  }, [currentDiagramId, flowRuntime, toast, t]);

  const handleStopExecution = useCallback(() => {
    flowRuntime.cancelFlow();
  }, [flowRuntime]);

  const handleCheckpointApprove = useCallback((userInput?: string) => {
    if (flowRuntime.checkpoint && currentDiagramId) {
      const executionSessionId = `flow-exec-${Date.now()}`;
      flowRuntime.resumeFlow(
        currentDiagramId,
        executionSessionId,
        flowRuntime.checkpoint.nodeId,
        true,
        userInput
      );
    }
  }, [flowRuntime, currentDiagramId]);

  const handleCheckpointReject = useCallback(() => {
    if (flowRuntime.checkpoint && currentDiagramId) {
      const executionSessionId = `flow-exec-${Date.now()}`;
      flowRuntime.resumeFlow(
        currentDiagramId,
        executionSessionId,
        flowRuntime.checkpoint.nodeId,
        false
      );
    }
  }, [flowRuntime, currentDiagramId]);

  const headerActions = useMemo(() => (
    <FlowHeaderActions
      diagramName={diagramName}
      savedDiagrams={diagrams}
      currentDiagramId={currentDiagramId}
      onLoadDiagram={handleLoadDiagram}
      onDeleteDiagram={deleteDiagram}
      onSave={handleSave}
      onNew={handleNew}
      onExportPng={exportPng}
      onExportSvg={exportSvg}
      onExportJson={exportJson}
      onExportYaml={exportYaml}
      onExportPdf={exportPdf}
      onCopyToClipboard={copyToClipboard}
      onGenerateMermaid={handleGenerateMermaid}
      isSaving={isSaving}
      hasChanges={hasChanges}
    />
  ), [diagramName, diagrams, currentDiagramId, handleLoadDiagram, deleteDiagram, 
      handleSave, handleNew, exportPng, exportSvg, exportJson, exportYaml, 
      exportPdf, copyToClipboard, handleGenerateMermaid, isSaving, hasChanges]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout headerActions={headerActions}>
      <TooltipProvider>
        <div className="flex flex-col h-[calc(100vh-2.5rem)]">
          <FlowToolbar
            diagramName={diagramName}
            onNameChange={setDiagramName}
            edgeSettings={edgeSettings}
            onEdgeSettingsChange={handleEdgeSettingsChange}
            canUndo={history.canUndo}
            canRedo={history.canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onAutoLayout={handleAutoLayout}
            hasChanges={hasChanges}
            isExecuting={flowRuntime.isRunning}
            onStartExecution={handleStartExecution}
            onStopExecution={handleStopExecution}
            canExecute={canExecute}
          />
          <div className="flex flex-1 overflow-hidden">
            <FlowSidebar onDragStart={onDragStart} />
            <FlowCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              setNodes={setNodes}
              setEdges={setEdges}
              onInit={onInit}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              onPaneClick={handlePaneClick}
              edgeSettings={edgeSettings}
              nodeStatuses={flowRuntime.nodeStatuses}
              nodeOutputs={flowRuntime.nodeOutputs}
            />
            {selectedNode && !showExecutionPanel && (
              <NodePropertiesPanel
                selectedNode={selectedNode}
                onClose={() => setSelectedNode(null)}
                onUpdateNode={handleUpdateNode}
                onDeleteNode={handleDeleteNode}
              />
            )}
            {selectedEdge && !showExecutionPanel && (
              <EdgePropertiesPanel
                selectedEdge={selectedEdge}
                onClose={() => setSelectedEdge(null)}
                onUpdateEdge={handleUpdateEdge}
                onDeleteEdge={handleDeleteEdge}
              />
            )}
            {showExecutionPanel && (
              <FlowExecutionPanel
                state={flowRuntime}
                onCancel={handleStopExecution}
                onClose={() => setShowExecutionPanel(false)}
              />
            )}
          </div>
        </div>
      </TooltipProvider>

      {/* Checkpoint dialog */}
      {flowRuntime.checkpoint && (
        <FlowCheckpointDialog
          open={flowRuntime.isPaused && !!flowRuntime.checkpoint}
          nodeId={flowRuntime.checkpoint.nodeId}
          message={flowRuntime.checkpoint.message}
          onApprove={handleCheckpointApprove}
          onReject={handleCheckpointReject}
        />
      )}
    </Layout>
  );
}

export default function FlowEditor() {
  return (
    <ReactFlowProvider>
      <FlowEditorContent />
    </ReactFlowProvider>
  );
}
