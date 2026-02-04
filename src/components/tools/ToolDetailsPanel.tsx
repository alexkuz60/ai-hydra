import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, FileText, Pencil, Trash2, Users, Copy, Lock, Calculator, Clock, Search, Download } from 'lucide-react';
import type { CustomTool, SystemTool } from '@/types/customTools';
import { cn } from '@/lib/utils';
import { isSystemTool, ToolItem } from './ToolRow';
import { ToolUsageStats } from './ToolUsageStats';

function getToolIcon(tool: ToolItem) {
  if (isSystemTool(tool)) {
    switch (tool.name) {
      case 'calculator': return Calculator;
      case 'current_datetime': return Clock;
      case 'web_search': return Search;
      default: return Lock;
    }
  }
  return tool.tool_type === 'http_api' ? Globe : FileText;
}

interface ToolDetailsPanelProps {
  tool: ToolItem | null;
  allTools?: CustomTool[];
  isOwned: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onExport?: () => void;
}

export function ToolDetailsPanel({
  tool,
  allTools = [],
  isOwned,
  onEdit,
  onDelete,
  onDuplicate,
  onExport,
}: ToolDetailsPanelProps) {
  const { t } = useLanguage();

  if (!tool) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground p-8">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>{t('tools.selectTool')}</p>
        </div>
      </div>
    );
  }

  const isSystem = isSystemTool(tool);
  const isHttp = !isSystem && tool.tool_type === 'http_api';
  const hc = !isSystem ? (tool as CustomTool).http_config : null;
  const Icon = getToolIcon(tool);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
              isSystem ? "bg-amber-500/10" : "bg-primary/10"
            )}>
              <Icon className={cn(
                "h-6 w-6",
                isSystem ? "text-amber-500" : "text-primary"
              )} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{tool.display_name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <code className="text-sm bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground">
                  {tool.name}
                </code>
                {isSystem ? (
                  <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400 gap-1">
                    <Lock className="h-3 w-3" />
                    {t('tools.systemTool')}
                  </Badge>
                ) : (
                  <Badge variant="secondary">{isHttp ? 'HTTP API' : 'Prompt Template'}</Badge>
                )}
                {!isSystem && (tool as CustomTool).is_shared && (
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    {t('tools.shared')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions - only for non-system tools */}
          {!isSystem && (
            <div className="flex items-center gap-1">
              {onExport && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onExport}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('tools.export')}</TooltipContent>
                </Tooltip>
              )}
              {onDuplicate && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onDuplicate}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('common.duplicate')}</TooltipContent>
                </Tooltip>
              )}
              {isOwned && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={onEdit}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('common.edit')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={onDelete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('common.delete')}</TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('tools.descriptionLabel')}</h3>
          <p className="text-sm">{tool.description}</p>
        </section>

        {/* Parameters */}
        {tool.parameters.length > 0 && (
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('tools.parameters')}</h3>
            <div className="flex flex-wrap gap-2">
              {tool.parameters.map((p, i) => (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        'font-mono text-xs cursor-help',
                        p.required && 'border-destructive/50'
                      )}
                    >
                      {p.name}: {p.type}
                      {p.required && <span className="text-destructive ml-0.5">*</span>}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{p.description || t('tools.noDescription')}</p>
                    {p.required && <p className="text-destructive text-xs mt-1">{t('tools.required')}</p>}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </section>
        )}

        {/* HTTP Config - only for custom HTTP tools */}
        {!isSystem && isHttp && hc && (
          <section className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">{t('tools.httpConfig')}</h3>
            
            {/* URL & Method */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">{hc.method}</Badge>
              <code className="text-sm bg-muted px-2 py-1 rounded font-mono flex-1 truncate">
                {hc.url}
              </code>
            </div>
            
            {/* Headers */}
            {hc.headers && Object.keys(hc.headers).length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">{t('tools.headers')}</h4>
                <div className="space-y-1">
                  {Object.entries(hc.headers).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="truncate">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Body Template */}
            {hc.body_template && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">{t('tools.bodyTemplate')}</h4>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-32 font-mono">
                  {hc.body_template}
                </pre>
              </div>
            )}
            
            {/* Response Path */}
            {hc.response_path && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">{t('tools.responsePath')}</h4>
                <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                  {hc.response_path}
                </code>
              </div>
            )}
          </section>
        )}

        {/* Prompt Template - only for custom prompt tools */}
        {!isSystem && !isHttp && (tool as CustomTool).prompt_template && (
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('tools.promptTemplate')}</h3>
            <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-48 whitespace-pre-wrap font-mono">
              {(tool as CustomTool).prompt_template}
            </pre>
          </section>
        )}

        {/* System tool note */}
        {isSystem && (
          <section className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {t('tools.systemToolNote')}
            </p>
          </section>
        )}

        {/* Usage Statistics - only for custom tools */}
        {!isSystem && (
          <ToolUsageStats 
            tool={tool as CustomTool} 
            allTools={allTools} 
          />
        )}
      </div>
    </ScrollArea>
  );
}
