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
import { MermaidBlock } from '@/components/warroom/MermaidBlock';
import { LucideIconInline } from './LucideIconInline';
import { RoleIconInline, getRoleFromName } from './RoleIconInline';
import { RolePlayground } from './RolePlayground';
import 'katex/dist/katex.min.css';

interface HydrapediaMarkdownProps {
  content: string;
  className?: string;
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

  // Determine if this is truly inline code (no language, short, no newlines)
  const isInlineCode = inline || (!className && !codeString.includes('\n') && codeString.length < 100);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check for playground marker
  if (codeString === ':::playground:::') {
    return <RolePlayground />;
  }

  // Check if inline code is a Lucide icon name or role
  if (isInlineCode) {
    // Check if it's a role reference like @assistant or @арбитр
    if (codeString.startsWith('@')) {
      const roleName = codeString.slice(1);
      const role = getRoleFromName(roleName);
      if (role) {
        return <RoleIconInline role={role} />;
      }
    }
    
    // Check if it looks like a Lucide icon name (PascalCase)
    const iconPattern = /^[A-Z][a-zA-Z0-9]*$/;
    const excludedNames = ['GET', 'POST', 'PUT', 'DELETE', 'JSON', 'API', 'HTTP', 'CORS', 'RU', 'EN', 'URL', 'HTML', 'CSS', 'SQL', 'UUID', 'ID'];
    const isLikelyIcon = iconPattern.test(codeString) && 
      !excludedNames.includes(codeString) &&
      !codeString.includes('.') &&
      codeString.length > 1 &&
      codeString.length < 30;
    
    if (isLikelyIcon) {
      return <LucideIconInline name={codeString} />;
    }
    
    return (
      <code 
        className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary"
        {...props}
      >
        {children}
      </code>
    );
  }

  // Render Mermaid diagrams
  if (language === 'mermaid') {
    return <MermaidBlock content={codeString} />;
  }

  // Block code with syntax highlighting - wrapped in span to avoid div-in-p issues
  return (
    <span className="block relative group my-3">
      {language && (
        <span className="absolute top-0 left-0 px-2 py-1 text-[10px] text-muted-foreground bg-muted/80 rounded-tl rounded-br font-mono z-10">
          {language}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
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
        PreTag="span"
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          padding: '1rem',
          paddingTop: language ? '1.75rem' : '1rem',
          display: 'block',
        }}
        {...props}
      >
        {codeString}
      </SyntaxHighlighter>
    </span>
  );
}

export function HydrapediaMarkdown({ content, className }: HydrapediaMarkdownProps) {
  return (
    <div className={cn('markdown-content hydrapedia-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code: CodeBlock as any,
          // Headings
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mt-6 mb-3 text-foreground bg-gradient-to-r from-primary to-hydra-expert bg-clip-text text-transparent">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mt-5 mb-2 text-foreground">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium mt-4 mb-2 text-foreground">{children}</h3>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p className="my-2.5 leading-relaxed text-base">{children}</p>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside my-2 space-y-1.5 text-base">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside my-2 space-y-1.5 text-base">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="ml-2 text-base">{children}</li>
          ),
          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-primary pl-4 my-3 italic text-muted-foreground bg-muted/30 py-2 rounded-r">
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
            <div className="overflow-x-auto my-4">
              <table className="min-w-full text-sm border border-border rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2.5 text-left font-medium border-b border-border text-sm">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2.5 border-b border-border text-sm align-middle">{children}</td>
          ),
          // Horizontal rule
          hr: () => <hr className="my-6 border-border" />,
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
