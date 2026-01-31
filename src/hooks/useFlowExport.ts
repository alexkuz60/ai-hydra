import { useCallback } from 'react';
import { Node, Edge, ReactFlowInstance } from '@xyflow/react';
import { toPng, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import yaml from 'js-yaml';
import { useToast } from '@/hooks/use-toast';

interface UseFlowExportOptions {
  diagramName: string;
  nodes: Node[];
  edges: Edge[];
  getViewport: () => { x: number; y: number; zoom: number } | undefined;
}

export function useFlowExport({ diagramName, nodes, edges, getViewport }: UseFlowExportOptions) {
  const { toast } = useToast();

  const getViewportElement = useCallback(() => {
    return document.querySelector('.react-flow__viewport') as HTMLElement | null;
  }, []);

  const exportPng = useCallback(async () => {
    const viewport = getViewportElement();
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
      toast({ description: 'PNG экспортирован успешно' });
    } catch (error) {
      toast({ variant: 'destructive', description: 'Ошибка экспорта PNG' });
    }
  }, [diagramName, getViewportElement, toast]);

  const exportSvg = useCallback(async () => {
    const viewport = getViewportElement();
    if (!viewport) return;

    try {
      const dataUrl = await toSvg(viewport, {
        backgroundColor: 'transparent',
      });
      const link = document.createElement('a');
      link.download = `${diagramName}.svg`;
      link.href = dataUrl;
      link.click();
      toast({ description: 'SVG экспортирован успешно' });
    } catch (error) {
      toast({ variant: 'destructive', description: 'Ошибка экспорта SVG' });
    }
  }, [diagramName, getViewportElement, toast]);

  const exportJson = useCallback(() => {
    const data = {
      name: diagramName,
      nodes,
      edges,
      viewport: getViewport(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${diagramName}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast({ description: 'JSON экспортирован успешно' });
  }, [diagramName, nodes, edges, getViewport, toast]);

  const exportYaml = useCallback(() => {
    const data = {
      name: diagramName,
      nodes,
      edges,
      viewport: getViewport(),
    };
    const yamlStr = yaml.dump(data, { indent: 2, lineWidth: -1 });
    const blob = new Blob([yamlStr], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${diagramName}.yaml`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast({ description: 'YAML экспортирован успешно' });
  }, [diagramName, nodes, edges, getViewport, toast]);

  const exportPdf = useCallback(async () => {
    const viewport = getViewportElement();
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
      
      let imgWidth: number, imgHeight: number;
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
  }, [diagramName, getViewportElement, toast]);

  const copyToClipboard = useCallback(async () => {
    const data = {
      name: diagramName,
      nodes,
      edges,
      viewport: getViewport(),
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      toast({ description: 'Скопировано в буфер обмена' });
    } catch (error) {
      toast({ variant: 'destructive', description: 'Ошибка копирования' });
    }
  }, [diagramName, nodes, edges, getViewport, toast]);

  return {
    exportPng,
    exportSvg,
    exportJson,
    exportYaml,
    exportPdf,
    copyToClipboard,
  };
}
