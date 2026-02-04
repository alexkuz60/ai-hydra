import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, FileText, Pencil, Trash2, Users, Copy, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import type { CustomTool } from '@/types/customTools';
import { cn } from '@/lib/utils';

interface ToolDetailsPanelProps {
  tool: CustomTool | null;
  isOwned: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
}

export function ToolDetailsPanel({
  tool,
  isOwned,
  onEdit,
  onDelete,
  onDuplicate,
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

  const isHttp = tool.tool_type === 'http_api';
  const hc = tool.http_config;

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              {isHttp ? (
                <Globe className="h-6 w-6 text-primary" />
              ) : (
                <FileText className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{tool.display_name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <code className="text-sm bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground">
                  {tool.name}
                </code>
                <Badge variant="secondary">{isHttp ? 'HTTP API' : 'Prompt Template'}</Badge>
                {tool.is_shared && (
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    {t('tools.shared')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1">
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

        {/* HTTP Config */}
        {isHttp && hc && (
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

        {/* Prompt Template */}
        {!isHttp && tool.prompt_template && (
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('tools.promptTemplate')}</h3>
            <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-48 whitespace-pre-wrap font-mono">
              {tool.prompt_template}
            </pre>
          </section>
        )}

        {/* Metadata */}
        <section className="pt-4 border-t">
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">{t('tools.usageCount')}:</span> {tool.usage_count}
            </div>
            <div>
              <span className="font-medium">{t('tools.created')}:</span>{' '}
              {format(new Date(tool.created_at), 'dd.MM.yyyy')}
            </div>
            <div>
              <span className="font-medium">{t('tools.updated')}:</span>{' '}
              {format(new Date(tool.updated_at), 'dd.MM.yyyy')}
            </div>
          </div>
        </section>
      </div>
    </ScrollArea>
  );
}
