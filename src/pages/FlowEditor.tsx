import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNodesState, useEdgesState, Node, Edge, ReactFlowInstance, ReactFlowProvider } from '@xyflow/react';
import { Layout } from '@/components/layout/Layout';
import { FlowCanvas } from '@/components/flow/FlowCanvas';
import { FlowSidebar } from '@/components/flow/FlowSidebar';
import { FlowToolbar } from '@/components/flow/FlowToolbar';
import { NodePropertiesPanel } from '@/components/flow/NodePropertiesPanel';
import { useFlowDiagrams, exportToMermaid } from '@/hooks/useFlowDiagrams';
import { useFlowExport } from '@/hooks/useFlowExport';
import { FlowNodeType, FlowDiagram } from '@/types/flow';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

function FlowEditorContent() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { diagrams, saveDiagram, isSaving, isLoading } = useFlowDiagrams();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [diagramName, setDiagramName] = useState(t('flowEditor.newDiagram'));
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

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

  // Load last saved diagram on mount
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (!isLoading && diagrams.length > 0 && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      const lastDiagram = diagrams[0]; // Already sorted by updated_at desc
      handleLoadDiagram(lastDiagram);
    }
  }, [isLoading, diagrams]);

  // Track changes
  useEffect(() => {
    setHasChanges(true);
  }, [nodes, edges]);

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
  }, [setNodes, setEdges, t]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleUpdateNode = useCallback((nodeId: string, data: Record<string, unknown>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data } : node
      )
    );
    // Update selected node reference
    setSelectedNode((prev) =>
      prev?.id === nodeId ? { ...prev, data } : prev
    );
  }, [setNodes]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  }, [setNodes, setEdges]);

  const handleLoadDiagram = useCallback((diagram: FlowDiagram) => {
    setNodes(diagram.nodes as Node[]);
    setEdges(diagram.edges);
    setDiagramName(diagram.name);
    setCurrentDiagramId(diagram.id);
    setHasChanges(false);
    setSelectedNode(null);

    if (diagram.viewport && reactFlowInstance.current) {
      reactFlowInstance.current.setViewport(diagram.viewport);
    }
  }, [setNodes, setEdges]);

  const handleGenerateMermaid = useCallback(() => {
    return exportToMermaid(nodes, edges);
  }, [nodes, edges]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <FlowToolbar
          diagramName={diagramName}
          onNameChange={setDiagramName}
          onSave={handleSave}
          onNew={handleNew}
          onExportPng={exportPng}
          onExportSvg={exportSvg}
          onExportJson={exportJson}
          onExportYaml={exportYaml}
          onExportPdf={exportPdf}
          onCopyToClipboard={copyToClipboard}
          onGenerateMermaid={handleGenerateMermaid}
          savedDiagrams={diagrams}
          onLoadDiagram={handleLoadDiagram}
          isSaving={isSaving}
          hasChanges={hasChanges}
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
            onPaneClick={handlePaneClick}
          />
          {selectedNode && (
            <NodePropertiesPanel
              selectedNode={selectedNode}
              onClose={() => setSelectedNode(null)}
              onUpdateNode={handleUpdateNode}
              onDeleteNode={handleDeleteNode}
            />
          )}
        </div>
      </div>
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
