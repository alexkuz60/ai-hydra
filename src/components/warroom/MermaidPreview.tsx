import React, { useEffect, useState, useId, useRef } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Loader2, AlertCircle } from 'lucide-react';

interface MermaidPreviewProps {
  content: string;
  className?: string;
  maxHeight?: number;
}

// Module-level cache for rendered SVGs
// Key format: `${theme}-${contentHash}`
const svgCache = new Map<string, string>();

// Simple hash function for cache keys
function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Compact Mermaid preview component for thumbnails/previews.
 * Simpler than MermaidBlock - no toolbar, zoom, or copy functionality.
 * Includes caching to avoid re-rendering the same diagrams.
 */
export function MermaidPreview({ content, className, maxHeight = 120 }: MermaidPreviewProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const uniqueId = useId().replace(/:/g, '-');

  useEffect(() => {
    let cancelled = false;
    
    const renderDiagram = async () => {
      if (!content.trim()) {
        setError(true);
        setLoading(false);
        return;
      }

      // Check cache first
      const cacheKey = `${theme}-${hashContent(content)}`;
      const cached = svgCache.get(cacheKey);
      
      if (cached) {
        setSvg(cached);
        setError(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(false);

      // Clean up any orphaned elements
      const orphanedElements = document.querySelectorAll(`[id^="preview-${uniqueId}"]`);
      orphanedElements.forEach(el => el.remove());

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
            nodeSpacing: 30,
            rankSpacing: 30,
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
            fontSize: '10px',
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
            fontSize: '10px',
          },
        });

        const { svg: renderedSvg } = await mermaid.render(`preview-${uniqueId}`, content);
        
        if (!cancelled) {
          // Store in cache
          svgCache.set(cacheKey, renderedSvg);
          
          // Limit cache size (keep last 50 entries)
          if (svgCache.size > 50) {
            const firstKey = svgCache.keys().next().value;
            if (firstKey) svgCache.delete(firstKey);
          }
          
          setSvg(renderedSvg);
          setError(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(true);
          setSvg('');
        }
        
        // Cleanup error artifacts
        const errorElements = document.querySelectorAll(`[id^="preview-${uniqueId}"]`);
        errorElements.forEach(el => el.remove());
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    renderDiagram();
    
    return () => {
      cancelled = true;
      const elementsToClean = document.querySelectorAll(`[id^="preview-${uniqueId}"]`);
      elementsToClean.forEach(el => el.remove());
    };
  }, [content, theme, uniqueId]);

  if (loading) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted/30 rounded border border-border/30",
          className
        )}
        style={{ height: maxHeight }}
      >
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center gap-1.5 bg-destructive/10 rounded border border-destructive/20",
          className
        )}
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
      className={cn(
        "overflow-hidden bg-background/50 rounded border border-border/30",
        className
      )}
      style={{ maxHeight }}
    >
      <div 
        className="flex items-center justify-center p-2 [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:h-auto"
        style={{ 
          maxHeight,
          transform: 'scale(0.6)',
          transformOrigin: 'center center',
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
