import React, { useEffect, useRef, useState, useId, useCallback } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Copy, Check, AlertCircle, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MermaidBlockProps {
  content: string;
  className?: string;
}

export function MermaidBlock({ content, className }: MermaidBlockProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const renderAttemptRef = useRef(0);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);
  const uniqueId = useId().replace(/:/g, '-');

  const cleanupMermaidElements = useCallback((id: string) => {
    const selectors = [
      `[id^="mermaid-${id}"]`,
      `[id^="dmermaid-${id}"]`,
      `[id*="d${id}"]`,
    ];
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => el.remove());
    });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const currentAttempt = ++renderAttemptRef.current;

    const renderDiagram = async () => {
      if (!content.trim()) {
        if (mountedRef.current) {
          setError('Empty diagram content');
          setLoading(false);
        }
        return;
      }

      // Wait for next frame to ensure DOM is ready
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Additional small delay for stability
      await new Promise(resolve => setTimeout(resolve, 50));

      // Check if component is still mounted and this is still the current render attempt
      if (!mountedRef.current || currentAttempt !== renderAttemptRef.current) {
        return;
      }

      // Clean up any orphaned mermaid elements from previous failed renders
      cleanupMermaidElements(uniqueId);

      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: theme === 'dark' ? 'dark' : 'default',
          securityLevel: 'strict',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
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

        const { svg: renderedSvg } = await mermaid.render(`mermaid-${uniqueId}-${currentAttempt}`, content);
        
        if (mountedRef.current && currentAttempt === renderAttemptRef.current) {
          setSvg(renderedSvg);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        
        if (mountedRef.current && currentAttempt === renderAttemptRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
          setSvg('');
          setLoading(false);
        }
        
        // Clean up any error artifacts
        cleanupMermaidElements(uniqueId);
        
        // Clean up dangling mermaid error divs
        const danglingErrors = document.querySelectorAll('.mermaid-error, #dmermaid, [id^="dmermaid"]');
        danglingErrors.forEach(el => {
          if (!containerRef.current?.contains(el)) {
            el.remove();
          }
        });
      }
    };

    setLoading(true);
    renderDiagram();
    
    return () => {
      mountedRef.current = false;
      cleanupMermaidElements(uniqueId);
    };
  }, [content, theme, uniqueId, cleanupMermaidElements]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

  if (loading) {
    return (
      <div className={cn(
        "my-3 rounded-lg border border-border bg-card overflow-hidden",
        className
      )}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
          <span className="text-xs text-muted-foreground font-mono">mermaid</span>
        </div>
        <div 
          className="flex items-center justify-center p-8 bg-background/50"
          style={{ minHeight: '150px' }}
        >
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

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
