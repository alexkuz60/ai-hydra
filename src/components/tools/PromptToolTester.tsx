import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Play, ChevronDown, ChevronUp, Copy, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolParameter } from '@/types/customTools';
import { toast } from 'sonner';

interface PromptToolTesterProps {
  promptTemplate: string;
  parameters: ToolParameter[];
  toolName: string;
}

export function PromptToolTester({ promptTemplate, parameters, toolName }: PromptToolTesterProps) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  // Extract placeholders from template
  const placeholders = useMemo(() => {
    const regex = /\{\{(\w+)\}\}/g;
    const found: string[] = [];
    let match;
    while ((match = regex.exec(promptTemplate)) !== null) {
      if (!found.includes(match[1])) {
        found.push(match[1]);
      }
    }
    return found;
  }, [promptTemplate]);

  // Combine defined parameters with discovered placeholders
  const allParams = useMemo(() => {
    const defined = new Set(parameters.map(p => p.name));
    const undefinedPlaceholders = placeholders.filter(p => !defined.has(p));
    return [
      ...parameters,
      ...undefinedPlaceholders.map(name => ({
        name,
        type: 'string' as const,
        description: '',
        required: false,
        isUndefined: true,
      })),
    ];
  }, [parameters, placeholders]);

  // Generate preview with substituted values
  const preview = useMemo(() => {
    let result = promptTemplate;
    for (const param of allParams) {
      const value = paramValues[param.name] || `{{${param.name}}}`;
      result = result.replace(new RegExp(`\\{\\{${param.name}\\}\\}`, 'g'), value);
    }
    return result;
  }, [promptTemplate, allParams, paramValues]);

  // Check if all required params are filled
  const allRequiredFilled = useMemo(() => {
    return parameters
      .filter(p => p.required)
      .every(p => paramValues[p.name]?.trim());
  }, [parameters, paramValues]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(preview);
      setCopied(true);
      toast.success(t('common.copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('common.copyFailed'));
    }
  };

  if (!promptTemplate.trim()) {
    return null;
  }

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer py-3 px-4">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-primary" />
                {t('tools.testPromptTool')}
              </div>
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4 space-y-4">
            {/* Parameter inputs */}
            {allParams.length > 0 && (
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">{t('tools.testParams')}</Label>
                <div className="grid gap-2">
                  {allParams.map((param) => (
                    <div key={param.name} className="flex items-center gap-2">
                      <div className="flex items-center gap-1 min-w-[120px]">
                        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                          {param.name}
                        </code>
                        {param.required && (
                          <span className="text-destructive text-xs">*</span>
                        )}
                        {'isUndefined' in param && param.isUndefined && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-amber-600 border-amber-500/50">
                            {t('tools.undefined')}
                          </Badge>
                        )}
                      </div>
                      <Input
                        value={paramValues[param.name] || ''}
                        onChange={(e) => setParamValues(prev => ({ 
                          ...prev, 
                          [param.name]: e.target.value 
                        }))}
                        placeholder={param.description || t('tools.enterValue')}
                        className="flex-1 h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">{t('tools.previewResult')}</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      {t('common.copied')}
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      {t('common.copy')}
                    </>
                  )}
                </Button>
              </div>
              <div className={cn(
                "p-3 rounded-lg bg-background border text-sm font-mono whitespace-pre-wrap",
                "max-h-[200px] overflow-auto",
                !allRequiredFilled && parameters.some(p => p.required) && "opacity-60"
              )}>
                {preview.split(/(\{\{[^}]+\}\})/).map((part, i) => {
                  if (/^\{\{[^}]+\}\}$/.test(part)) {
                    return (
                      <span key={i} className="text-primary bg-primary/10 px-0.5 rounded">
                        {part}
                      </span>
                    );
                  }
                  return <span key={i}>{part}</span>;
                })}
              </div>
            </div>

            {/* Hint about undefined params */}
            {allParams.some(p => 'isUndefined' in p && p.isUndefined) && (
              <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-500/10 p-2 rounded-lg">
                <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{t('tools.undefinedParamsHint')}</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
