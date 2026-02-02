import React, { useEffect, useRef, useState, useId } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Copy, Check, AlertCircle, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MermaidBlockProps {
  content: string;
  className?: string;
}

export function MermaidBlock({ content, className }: MermaidBlockProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);
  const uniqueId = useId().replace(/:/g, '-');

  useEffect(() => {
    const renderDiagram = async () => {
      if (!content.trim()) {
        setError('Empty diagram content');
        return;
      }

      // Clean up any orphaned mermaid elements from previous failed renders
      const orphanedElements = document.querySelectorAll(`[id^="mermaid-${uniqueId}"], [id^="dmermaid-${uniqueId}"]`);
      orphanedElements.forEach(el => el.remove());

      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: theme === 'dark' ? 'dark' : 'default',
          securityLevel: 'strict',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          // Suppress console output for cleaner UX
          suppressErrorRendering: true,
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
          },
          themeVariables: theme === 'dark' ? {
            primaryColor: '#3b82f6',
            primaryTextColor: '#f8fafc',
            primaryBorderColor: '#1e40af',
            lineColor: '#64748b',
            secondaryColor: '#1e293b',
            tertiaryColor: '#334155',
            background: '#0f172a',
            mainBkg: '#1e293b',
            nodeBorder: '#3b82f6',
            clusterBkg: '#1e293b',
            clusterBorder: '#475569',
            titleColor: '#f8fafc',
            edgeLabelBackground: '#1e293b',
          } : {
            primaryColor: '#3b82f6',
            primaryTextColor: '#1e293b',
            primaryBorderColor: '#1e40af',
            lineColor: '#64748b',
            secondaryColor: '#e2e8f0',
            tertiaryColor: '#f1f5f9',
            background: '#ffffff',
            mainBkg: '#f8fafc',
            nodeBorder: '#3b82f6',
            clusterBkg: '#f1f5f9',
            clusterBorder: '#cbd5e1',
            titleColor: '#1e293b',
            edgeLabelBackground: '#f8fafc',
          },
        });

        const { svg: renderedSvg } = await mermaid.render(`mermaid-${uniqueId}`, content);
        setSvg(renderedSvg);
        setError(null);
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
        setSvg('');
        
        // Clean up any error artifacts created by Mermaid in the DOM
        // Mermaid sometimes creates orphaned elements on error
        const errorElements = document.querySelectorAll(`[id^="mermaid-${uniqueId}"], [id*="d${uniqueId}"]`);
        errorElements.forEach(el => el.remove());
        
        // Also clean up any dangling mermaid error divs that might be outside our container
        const danglingErrors = document.querySelectorAll('.mermaid-error, #dmermaid, [id^="dmermaid"]');
        danglingErrors.forEach(el => {
          // Only remove if it's not inside our component
          if (!containerRef.current?.contains(el)) {
            el.remove();
          }
        });
      }
    };

    renderDiagram();
    
    // Cleanup on unmount
    return () => {
      const elementsToClean = document.querySelectorAll(`[id^="mermaid-${uniqueId}"], [id^="dmermaid-${uniqueId}"]`);
      elementsToClean.forEach(el => el.remove());
    };
  }, [content, theme, uniqueId]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

  if (error) {
    return (
      <div className={cn(
        "my-3 p-4 rounded-lg border border-destructive/50 bg-destructive/10",
        className
      )}>
        <div className="flex items-center gap-2 text-destructive mb-2">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Ошибка рендеринга диаграммы</span>
        </div>
        <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
          {error}
        </pre>
        <details className="mt-2">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            Исходный код
          </summary>
          <pre className="mt-2 p-2 bg-muted/50 rounded text-xs overflow-x-auto">
            {content}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className={cn(
      "my-3 rounded-lg border border-border bg-card overflow-hidden",
      className
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <span className="text-xs text-muted-foreground font-mono">mermaid</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleZoomOut}
            title="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleZoomIn}
            title="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleCopy}
            title="Copy code"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-hydra-success" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Diagram */}
      <div 
        ref={containerRef}
        className="overflow-auto p-4 bg-background/50"
        style={{ maxHeight: '500px' }}
      >
        <div 
          className="flex items-center justify-center transition-transform duration-200"
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: 'center top',
            minHeight: svg ? undefined : '100px'
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
}
