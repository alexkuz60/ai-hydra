import React, { useEffect, useRef, useState, useId, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Copy, Check, AlertCircle, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { renderMermaidWithRetry } from '@/lib/mermaidRenderer';

interface MermaidBlockProps {
  content: string;
  className?: string;
  defaultZoom?: number;
}

export function MermaidBlock({ content, className, defaultZoom = 1 }: MermaidBlockProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(defaultZoom);
  const uniqueId = useId().replace(/:/g, '-');

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      if (!content.trim()) {
        setError('Empty diagram content');
        setLoading(false);
        return;
      }

      setLoading(true);

      // Wait for DOM readiness
      await new Promise(r => requestAnimationFrame(r));
      if (cancelled) return;

      try {
        const result = await renderMermaidWithRetry(content, theme, `mblk-${uniqueId}`);
        if (!cancelled) {
          setSvg(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
          setSvg('');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    render();
    return () => { cancelled = true; };
  }, [content, theme, uniqueId]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

  if (loading) {
    return (
      <div className={cn("my-3 rounded-lg border border-border bg-card overflow-hidden", className)}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
          <span className="text-xs text-muted-foreground font-mono">mermaid</span>
        </div>
        <div className="flex items-center justify-center p-8 bg-background/50" style={{ minHeight: '150px' }}>
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("my-3 p-4 rounded-lg border border-destructive/50 bg-destructive/10", className)}>
        <div className="flex items-center gap-2 text-destructive mb-2">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Ошибка рендеринга диаграммы</span>
        </div>
        <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">{error}</pre>
        <details className="mt-2">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Исходный код</summary>
          <pre className="mt-2 p-2 bg-muted/50 rounded text-xs overflow-x-auto">{content}</pre>
        </details>
      </div>
    );
  }

  return (
    <div className={cn("my-3 rounded-lg border border-border bg-card overflow-hidden", className)}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <span className="text-xs text-muted-foreground font-mono">mermaid</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut} title="Zoom out">
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn} title="Zoom in">
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy} title="Copy code">
            {copied ? <Check className="h-3.5 w-3.5 text-hydra-success" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
      <div
        ref={containerRef}
        data-mermaid-container
        className="overflow-auto p-4 bg-background/50"
        style={{ maxHeight: '500px' }}
      >
        <div
          className="flex items-center justify-center transition-transform duration-200"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center top', minHeight: svg ? undefined : '100px' }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
}
