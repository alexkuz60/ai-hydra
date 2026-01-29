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

function formatResult(result: ToolResult): { success: boolean; display: string } {
  const parsed = result.parsed || parseToolResult(result.content);
  
  if (!parsed.success) {
    return { success: false, display: parsed.error || 'Ошибка выполнения' };
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
        const formattedResult = result ? formatResult(result) : null;
        
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
                  "text-sm mt-1.5 font-medium",
                  formattedResult.success ? "text-accent-foreground" : "text-destructive"
                )}>
                  {formattedResult.success ? '→ ' : '✗ '}
                  {formattedResult.display}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
