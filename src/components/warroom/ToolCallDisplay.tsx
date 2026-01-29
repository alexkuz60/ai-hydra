import React from 'react';
import { Calculator, Clock, Search, Wrench, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolCall, ToolResult, parseToolResult, getToolDisplayName } from '@/types/tools';

interface ToolCallDisplayProps {
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  isExecuting?: boolean;
}

const toolIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  calculator: Calculator,
  current_datetime: Clock,
  web_search: Search,
};

function getToolIcon(toolName: string) {
  return toolIcons[toolName] || Wrench;
}

function formatArguments(args: string): string {
  try {
    const parsed = JSON.parse(args);
    return Object.entries(parsed)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ');
  } catch {
    return args;
  }
}

interface SearchResult {
  title: string;
  url: string;
  content: string;
  relevance?: number;
}

interface ParsedSearchResult {
  success: boolean;
  query?: string;
  answer?: string | null;
  results?: SearchResult[];
  sources_count?: number;
  error?: string;
}

function formatResult(result: ToolResult, toolName: string): { success: boolean; display: string; searchData?: ParsedSearchResult } {
  const parsed = result.parsed || parseToolResult(result.content);
  
  if (!parsed.success) {
    return { success: false, display: parsed.error || 'Ошибка выполнения' };
  }
  
  // Special handling for web_search
  if (toolName === 'web_search') {
    const searchData = parsed as ParsedSearchResult;
    if (searchData.answer) {
      return { success: true, display: searchData.answer, searchData };
    }
    return { success: true, display: `Найдено ${searchData.sources_count || 0} результатов`, searchData };
  }
  
  // Format based on tool type
  if ('result' in parsed && parsed.result !== undefined) {
    return { success: true, display: String(parsed.result) };
  }
  
  if ('datetime' in parsed) {
    return { success: true, display: String(parsed.datetime) };
  }
  
  if ('formatted' in parsed) {
    return { success: true, display: String(parsed.formatted) };
  }
  
  return { success: true, display: JSON.stringify(parsed) };
}

export function ToolCallDisplay({ toolCalls, toolResults, isExecuting }: ToolCallDisplayProps) {
  if (!toolCalls || toolCalls.length === 0) return null;
  
  // Create a map of results by tool_call_id
  const resultsMap = new Map<string, ToolResult>();
  toolResults?.forEach(result => {
    resultsMap.set(result.tool_call_id, result);
  });
  
  return (
    <div className="flex flex-col gap-2 my-3 p-3 bg-muted/30 rounded-lg border border-border/50">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
        Вызовы инструментов
      </div>
      
      {toolCalls.map((call) => {
        const Icon = getToolIcon(call.function.name);
        const result = resultsMap.get(call.id);
        const hasResult = !!result;
        const formattedResult = result ? formatResult(result, call.function.name) : null;
        const isWebSearch = call.function.name === 'web_search';
        
        return (
          <div 
            key={call.id}
            className={cn(
              "flex items-start gap-3 p-2 rounded-md transition-colors",
              hasResult 
                ? formattedResult?.success 
                  ? "bg-accent/20 border border-accent/30" 
                  : "bg-destructive/10 border border-destructive/20"
                : "bg-primary/5 border border-primary/10"
            )}
          >
            {/* Tool Icon */}
            <div className={cn(
              "flex-shrink-0 p-1.5 rounded",
              hasResult 
                ? formattedResult?.success 
                  ? "bg-accent/30 text-accent-foreground" 
                  : "bg-destructive/20 text-destructive"
                : "bg-primary/20 text-primary"
            )}>
              <Icon className="h-4 w-4" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-foreground">
                  {getToolDisplayName(call.function.name)}
                </span>
                
                {/* Status indicator */}
                {isExecuting && !hasResult ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : hasResult ? (
                  formattedResult?.success ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent-foreground" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                  )
                ) : null}
              </div>
              
              {/* Arguments */}
              <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                {formatArguments(call.function.arguments)}
              </div>
              
              {/* Result */}
              {hasResult && formattedResult && (
                <div className={cn(
                  "text-sm mt-1.5",
                  formattedResult.success ? "text-accent-foreground" : "text-destructive"
                )}>
                  {formattedResult.success ? '→ ' : '✗ '}
                  <span className="font-medium">{formattedResult.display}</span>
                  
                  {/* Web search sources */}
                  {isWebSearch && formattedResult.searchData?.results && formattedResult.searchData.results.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {formattedResult.searchData.results.slice(0, 3).map((source, idx) => (
                        <a
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          <span className="text-primary/60">[{idx + 1}]</span>
                          <span className="truncate">{source.title}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
