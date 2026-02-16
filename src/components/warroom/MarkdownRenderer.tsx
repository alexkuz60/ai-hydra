import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { Copy, Check, Loader2, Table as TableIcon, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MermaidBlock } from './MermaidBlock';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  /** When true, delays rendering of complex elements (tables, mermaid, syntax highlighting) until complete */
  streaming?: boolean;
  /** When true, checkboxes in task lists are clickable */
  interactiveChecklists?: boolean;
  /** Current checklist state (index -> checked) */
  checklistState?: Record<number, boolean>;
  /** Called when a checkbox is toggled */
  onChecklistChange?: (index: number, checked: boolean) => void;
}

// Streaming placeholder for Mermaid diagrams
function MermaidPlaceholder({ content }: { content: string }) {
  const lineCount = content.split('\n').length;
  return (
    <div className="my-3 p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 animate-pulse">
      <div className="flex items-center gap-2 text-primary/70">
        <GitBranch className="h-4 w-4" />
        <span className="text-sm font-medium">Диаграмма Mermaid</span>
        <Loader2 className="h-3 w-3 animate-spin ml-auto" />
      </div>
      <div className="mt-2 text-xs text-muted-foreground font-mono truncate">
        {content.split('\n')[0]}...
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {lineCount} строк • рендеринг после завершения
      </div>
    </div>
  );
}

// Streaming placeholder for tables
function TablePlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-3 p-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <TableIcon className="h-4 w-4" />
        <span className="text-xs font-medium">Таблица (загрузка...)</span>
        <Loader2 className="h-3 w-3 animate-spin ml-auto" />
      </div>
      {/* Show raw table content as simple text during streaming */}
      <div className="text-xs text-muted-foreground/70 font-mono overflow-hidden max-h-20">
        {children}
      </div>
    </div>
  );
}

// Simplified code block for streaming (no syntax highlighting)
function StreamingCodeBlock({ 
  language, 
  children 
}: { 
  language: string; 
  children: string;
}) {
  return (
    <div className="relative my-3">
      {language && (
        <div className="absolute top-0 left-0 px-2 py-1 text-[10px] text-muted-foreground bg-muted/80 rounded-tl rounded-br font-mono">
          {language}
        </div>
      )}
      <pre 
        className="bg-[#282c34] text-gray-300 rounded-lg overflow-x-auto"
        style={{
          margin: 0,
          fontSize: '0.75rem',
          padding: '1rem',
          paddingTop: language ? '1.75rem' : '1rem',
        }}
      >
        <code className="font-mono">{children}</code>
      </pre>
    </div>
  );
}

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  streaming?: boolean;
}

function CodeBlock({ 
  inline, 
  className, 
  children,
  streaming = false,
  ...props 
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <code 
        className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary"
        {...props}
      >
        {children}
      </code>
    );
  }

  // Mermaid diagrams: show placeholder during streaming
  if (language === 'mermaid') {
    if (streaming) {
      return <MermaidPlaceholder content={codeString} />;
    }
    return <MermaidBlock content={codeString} defaultZoom={0.5} />;
  }

  // During streaming: use simplified code block without syntax highlighting for performance
  if (streaming && codeString.length > 100) {
    return <StreamingCodeBlock language={language} children={codeString} />;
  }

  // Full rendering with syntax highlighting
  return (
    <div className="relative group my-3">
      {language && (
        <div className="absolute top-0 left-0 px-2 py-1 text-[10px] text-muted-foreground bg-muted/80 rounded-tl rounded-br font-mono">
          {language}
        </div>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-hydra-success" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
      <SyntaxHighlighter
        style={oneDark}
        language={language || 'text'}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          padding: '1rem',
          paddingTop: language ? '1.75rem' : '1rem',
        }}
        {...props}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}

export function MarkdownRenderer({ content, className, streaming = false, interactiveChecklists = false, checklistState, onChecklistChange }: MarkdownRendererProps) {
  // Track checkbox index across the entire render
  const checkboxIndexRef = React.useRef(0);
  
  // Reset counter before each render
  checkboxIndexRef.current = 0;

  // Memoize components to prevent unnecessary re-renders during streaming
  const components = useMemo(() => ({
    code: (props: any) => <CodeBlock {...props} streaming={streaming} />,
    // Headings
    h1: ({ children }: { children: React.ReactNode }) => (
      <h1 className="text-xl font-bold mt-4 mb-2 text-foreground">{children}</h1>
    ),
    h2: ({ children }: { children: React.ReactNode }) => (
      <h2 className="text-lg font-semibold mt-3 mb-2 text-foreground">{children}</h2>
    ),
    h3: ({ children }: { children: React.ReactNode }) => (
      <h3 className="text-base font-medium mt-2 mb-1 text-foreground">{children}</h3>
    ),
    // Paragraphs
    p: ({ children }: { children: React.ReactNode }) => (
      <p className="my-2 leading-relaxed">{children}</p>
    ),
    // Lists
    ul: ({ children }: { children: React.ReactNode }) => (
      <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
    ),
    ol: ({ children }: { children: React.ReactNode }) => (
      <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
    ),
    li: ({ children, ...props }: any) => {
      // Check if this is a task list item (has checkbox)
      const childArray = React.Children.toArray(children);
      const hasCheckbox = childArray.some(
        (child: any) => React.isValidElement(child) && (child as any).props?.type === 'checkbox'
      );
      if (hasCheckbox) {
        return <li className="ml-2 list-none flex items-start gap-1.5">{children}</li>;
      }
      return <li className="ml-2">{children}</li>;
    },
    // Interactive checkbox for task lists
    input: (props: any) => {
      if (props.type === 'checkbox') {
        const idx = checkboxIndexRef.current++;
        const isChecked = checklistState?.[idx] ?? props.checked ?? false;
        
        if (interactiveChecklists && onChecklistChange) {
          return (
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => onChecklistChange(idx, !isChecked)}
              className="mt-1 h-4 w-4 rounded border-primary text-primary cursor-pointer accent-primary"
            />
          );
        }
        // Read-only checkbox (default behavior)
        return (
          <input
            type="checkbox"
            checked={isChecked}
            disabled
            className="mt-1 h-4 w-4 rounded opacity-60"
          />
        );
      }
      return <input {...props} />;
    },
    // Blockquote
    blockquote: ({ children }: { children: React.ReactNode }) => (
      <blockquote className="border-l-3 border-primary pl-3 my-2 italic text-muted-foreground">
        {children}
      </blockquote>
    ),
    // Links
    a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {children}
      </a>
    ),
    // Tables: show placeholder during streaming, full table after
    table: ({ children }: { children: React.ReactNode }) => {
      if (streaming) {
        return <TablePlaceholder>{children}</TablePlaceholder>;
      }
      return (
        <div className="overflow-x-auto my-3">
          <table className="min-w-full text-xs border border-border rounded">
            {children}
          </table>
        </div>
      );
    },
    thead: ({ children }: { children: React.ReactNode }) => (
      <thead className="bg-muted/50">{children}</thead>
    ),
    th: ({ children }: { children: React.ReactNode }) => (
      <th className="px-3 py-2 text-left font-medium border-b border-border">{children}</th>
    ),
    td: ({ children }: { children: React.ReactNode }) => (
      <td className="px-3 py-2 border-b border-border">{children}</td>
    ),
    // Horizontal rule
    hr: () => <hr className="my-4 border-border" />,
    // Strong/Bold
    strong: ({ children }: { children: React.ReactNode }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    // Emphasis/Italic
    em: ({ children }: { children: React.ReactNode }) => (
      <em className="italic">{children}</em>
    ),
  }), [streaming, interactiveChecklists, checklistState, onChecklistChange]);

  return (
    <div className={cn('markdown-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
