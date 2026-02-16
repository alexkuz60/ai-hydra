import mermaid from 'mermaid';

/**
 * Centralized Mermaid renderer that serializes all render calls
 * to prevent concurrent mermaid.initialize() corruption.
 */

let currentTheme: string | null = null;
let renderQueue: Promise<void> = Promise.resolve();
let idCounter = 0;

function getThemeConfig(theme: string) {
  const isDark = theme === 'dark';
  return {
    startOnLoad: false,
    theme: isDark ? 'dark' as const : 'default' as const,
    securityLevel: 'strict' as const,
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    suppressErrorRendering: true,
    flowchart: {
      htmlLabels: true,
      curve: 'basis' as const,
    },
    themeVariables: isDark ? {
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
      fontSize: '12px',
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
      fontSize: '12px',
    },
  };
}

function ensureInitialized(theme: string) {
  if (currentTheme !== theme) {
    mermaid.initialize(getThemeConfig(theme));
    currentTheme = theme;
  }
}

function cleanupOrphans(prefix: string) {
  document.querySelectorAll(`[id^="${prefix}"]`).forEach(el => el.remove());
  // Also clean global mermaid error artifacts
  document.querySelectorAll('.mermaid-error, [id^="dmermaid"]').forEach(el => {
    if (!el.closest('[data-mermaid-container]')) el.remove();
  });
}

/**
 * Render mermaid content with serialized queue to prevent concurrent corruption.
 * Returns SVG string on success.
 */
/**
 * Sanitize mermaid content to work around known parser bugs in v11+.
 * - Removes `linkStyle default ...` lines that cause UNICODE_TEXT parse errors
 *   when hex colors like #333 are present.
 */
function sanitizeContent(raw: string): string {
  return raw
    .split('\n')
    .filter(line => {
      const trimmed = line.trim().toLowerCase();
      // Remove linkStyle lines with hex colors — mermaid v11 chokes on them
      if (trimmed.startsWith('linkstyle') && trimmed.includes('#')) {
        return false;
      }
      return true;
    })
    .join('\n');
}

export async function renderMermaid(
  content: string,
  theme: string,
  idPrefix: string,
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    renderQueue = renderQueue.then(async () => {
      const renderId = `${idPrefix}-${++idCounter}`;
      cleanupOrphans(idPrefix);

      try {
        // Re-initialize if theme changed
        ensureInitialized(theme);

        const { svg } = await mermaid.render(renderId, sanitizeContent(content));
        resolve(svg);
      } catch (err) {
        console.error('[MermaidRenderer] Render failed:', err, '\nContent (first 200 chars):', content.substring(0, 200));
        cleanupOrphans(idPrefix);
        // Force re-init on next call in case internal state is corrupted
        currentTheme = null;
        reject(err);
      }
    });
  });
}

/**
 * Render with automatic retry (re-initializes mermaid on first failure).
 */
export async function renderMermaidWithRetry(
  content: string,
  theme: string,
  idPrefix: string,
  maxRetries = 1,
): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Force full re-init on retry
        currentTheme = null;
      }
      return await renderMermaid(content, theme, idPrefix);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

// SVG cache (shared across components)
const svgCache = new Map<string, string>();

function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export function getCacheKey(theme: string, content: string): string {
  return `${theme}-${hashContent(content)}`;
}

export function getCachedSvg(key: string): string | undefined {
  return svgCache.get(key);
}

export function setCachedSvg(key: string, svg: string): void {
  svgCache.set(key, svg);
  if (svgCache.size > 50) {
    const firstKey = svgCache.keys().next().value;
    if (firstKey) svgCache.delete(firstKey);
  }
}
