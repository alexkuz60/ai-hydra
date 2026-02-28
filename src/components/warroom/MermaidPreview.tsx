import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Loader2, AlertCircle } from 'lucide-react';
import { renderMermaidWithRetry, getCacheKey, getCachedSvg, setCachedSvg } from '@/lib/mermaidRenderer';

interface MermaidPreviewProps {
  content: string;
  className?: string;
  maxHeight?: number;
}

let previewCounter = 0;

export const MermaidPreview = React.memo(function MermaidPreview({ content, className, maxHeight = 120 }: MermaidPreviewProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const idRef = useRef(`mpv-${++previewCounter}`);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      if (!content.trim()) {
        setError(true);
        setLoading(false);
        return;
      }

      const cacheKey = getCacheKey(theme, content);
      const cached = getCachedSvg(cacheKey);
      if (cached) {
        setSvg(cached);
        setError(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(false);

      try {
        const result = await renderMermaidWithRetry(content, theme, idRef.current);
        if (!cancelled) {
          setCachedSvg(cacheKey, result);
          setSvg(result);
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setSvg('');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    render();
    return () => { cancelled = true; };
  }, [content, theme]);

  if (loading) {
    return (
      <div
        className={cn("flex items-center justify-center bg-muted/30 rounded border border-border/30", className)}
        style={{ height: maxHeight }}
      >
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn("flex items-center justify-center gap-1.5 bg-destructive/10 rounded border border-destructive/20", className)}
        style={{ height: maxHeight }}
      >
        <AlertCircle className="h-3 w-3 text-destructive/60" />
        <span className="text-[10px] text-destructive/60">Error</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-mermaid-container
      className={cn("overflow-hidden bg-background/50 rounded border border-border/30", className)}
      style={{ maxHeight }}
    >
      <div
        className="flex items-center justify-center p-2 [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:h-auto"
        style={{ maxHeight, transform: 'scale(0.6)', transformOrigin: 'center center' }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
});
