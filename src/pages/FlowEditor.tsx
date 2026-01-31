import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNodesState, useEdgesState, Node, Edge, ReactFlowInstance, ReactFlowProvider } from '@xyflow/react';
import { Layout } from '@/components/layout/Layout';
import { FlowCanvas } from '@/components/flow/FlowCanvas';
import { FlowSidebar } from '@/components/flow/FlowSidebar';
import { FlowToolbar } from '@/components/flow/FlowToolbar';
import { NodePropertiesPanel } from '@/components/flow/NodePropertiesPanel';
import { useFlowDiagrams, exportToMermaid } from '@/hooks/useFlowDiagrams';
import { FlowNodeType, FlowDiagram } from '@/types/flow';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { toPng, toSvg } from 'html-to-image';
import { useToast } from '@/hooks/use-toast';
import yaml from 'js-yaml';
import { jsPDF } from 'jspdf';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

function FlowEditorContent() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const { diagrams, saveDiagram, isSaving } = useFlowDiagrams();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [diagramName, setDiagramName] = useState(t('flowEditor.newDiagram'));
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

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

  const handleExportPng = useCallback(async () => {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) return;

    try {
      const dataUrl = await toPng(viewport, {
        backgroundColor: 'transparent',
        quality: 1,
      });
      const link = document.createElement('a');
      link.download = `${diagramName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      toast({ variant: 'destructive', description: 'Ошибка экспорта PNG' });
    }
  }, [diagramName, toast]);

  const handleExportSvg = useCallback(async () => {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) return;

    try {
      const dataUrl = await toSvg(viewport, {
        backgroundColor: 'transparent',
      });
      const link = document.createElement('a');
      link.download = `${diagramName}.svg`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      toast({ variant: 'destructive', description: 'Ошибка экспорта SVG' });
    }
  }, [diagramName, toast]);

  const handleExportJson = useCallback(() => {
    const data = {
      name: diagramName,
      nodes,
      edges,
      viewport: reactFlowInstance.current?.getViewport(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${diagramName}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [diagramName, nodes, edges]);

  const handleExportYaml = useCallback(() => {
    const data = {
      name: diagramName,
      nodes,
      edges,
      viewport: reactFlowInstance.current?.getViewport(),
    };
    const yamlStr = yaml.dump(data, { indent: 2, lineWidth: -1 });
    const blob = new Blob([yamlStr], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${diagramName}.yaml`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [diagramName, nodes, edges]);

  const handleExportPdf = useCallback(async () => {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) return;

    try {
      const dataUrl = await toPng(viewport, {
        backgroundColor: '#ffffff',
        quality: 1,
      });
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
      });
      
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => { img.onload = resolve; });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgRatio = img.width / img.height;
      const pageRatio = pageWidth / pageHeight;
      
      let imgWidth, imgHeight;
      if (imgRatio > pageRatio) {
        imgWidth = pageWidth - 40;
        imgHeight = imgWidth / imgRatio;
      } else {
        imgHeight = pageHeight - 40;
        imgWidth = imgHeight * imgRatio;
      }
      
      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;
      
      pdf.setFontSize(16);
      pdf.text(diagramName, 20, 25);
      pdf.addImage(dataUrl, 'PNG', x, y + 10, imgWidth, imgHeight - 20);
      pdf.save(`${diagramName}.pdf`);
      
      toast({ description: 'PDF экспортирован успешно' });
    } catch (error) {
      toast({ variant: 'destructive', description: 'Ошибка экспорта PDF' });
    }
  }, [diagramName, toast]);

  const handleCopyToClipboard = useCallback(async () => {
    const data = {
      name: diagramName,
      nodes,
      edges,
      viewport: reactFlowInstance.current?.getViewport(),
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      toast({ description: 'Скопировано в буфер обмена' });
    } catch (error) {
      toast({ variant: 'destructive', description: 'Ошибка копирования' });
    }
  }, [diagramName, nodes, edges, toast]);

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
          onExportPng={handleExportPng}
          onExportSvg={handleExportSvg}
          onExportJson={handleExportJson}
          onExportYaml={handleExportYaml}
          onExportPdf={handleExportPdf}
          onCopyToClipboard={handleCopyToClipboard}
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
