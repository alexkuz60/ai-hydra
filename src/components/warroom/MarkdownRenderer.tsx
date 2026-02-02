import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MermaidBlock } from './MermaidBlock';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  /** When true, delays rendering of complex elements (tables, mermaid) until complete */
  streaming?: boolean;
}

function CodeBlock({ 
  inline, 
  className, 
  children, 
  ...props 
}: { 
  inline?: boolean; 
  className?: string; 
  children?: React.ReactNode;
}) {
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

  // Render Mermaid diagrams (only when not streaming)
  if (language === 'mermaid') {
    // Delay mermaid rendering during streaming to prevent flickering
    return <MermaidBlock content={codeString} />;
  }

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

export function MarkdownRenderer({ content, className, streaming = false }: MarkdownRendererProps) {
  return (
    <div className={cn('markdown-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code: CodeBlock as any,
          // Headings
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mt-4 mb-2 text-foreground">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mt-3 mb-2 text-foreground">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-medium mt-2 mb-1 text-foreground">{children}</h3>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p className="my-2 leading-relaxed">{children}</p>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="ml-2">{children}</li>
          ),
          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-primary pl-3 my-2 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          // Links
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {children}
            </a>
          ),
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full text-xs border border-border rounded">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-medium border-b border-border">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-b border-border">{children}</td>
          ),
          // Horizontal rule
          hr: () => <hr className="my-4 border-border" />,
          // Strong/Bold
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          // Emphasis/Italic
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
