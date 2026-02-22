import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  required: boolean;
}

interface HttpConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body_template?: string;
  response_path?: string;
}

interface TestResult {
  success: boolean;
  result?: unknown;
  error?: string;
  warning?: string;
  full_response?: unknown;
  response_body?: string;
  duration_ms?: number;
}

interface HttpToolTesterProps {
  httpConfig: HttpConfig;
  parameters: ToolParameter[];
  toolName: string;
}

export function HttpToolTester({ httpConfig, parameters, toolName }: HttpToolTesterProps) {
  const { t } = useLanguage();
  const [testParams, setTestParams] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    
    const startTime = Date.now();
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      if (!token) {
        setResult({
          success: false,
          error: t('tools.authRequired')
        });
        return;
      }

      // Call edge function for testing
      const response = await supabase.functions.invoke('hydra-orchestrator', {
        body: {
          action: 'test_http_tool',
          http_config: httpConfig,
          test_args: testParams,
          tool_name: toolName
        }
      });

      const duration_ms = Date.now() - startTime;

      if (response.error) {
        setResult({
          success: false,
          error: response.error.message,
          duration_ms
        });
      } else {
        setResult({
          ...response.data,
          duration_ms
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('tools.unknownError');
      setResult({
        success: false,
        error: message,
        duration_ms: Date.now() - startTime
      });
    } finally {
      setTesting(false);
    }
  };

  const updateParam = (name: string, value: string) => {
    setTestParams(prev => ({ ...prev, [name]: value }));
  };

  // Check if all required params are filled
  const requiredParamsFilled = parameters
    .filter(p => p.required)
    .every(p => testParams[p.name]?.trim());

  const canTest = httpConfig.url.trim() && requiredParamsFilled;

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger asChild>
        <Button 
          type="button" 
          variant="outline" 
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            {t('tools.testing')}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="pt-3 space-y-4">
        {/* Test Parameters */}
        {parameters.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('tools.testParamValues')}</Label>
            <div className="grid gap-2">
              {parameters.map((param) => (
                <div key={param.name} className="flex gap-2 items-center">
                  <Label className="w-32 text-xs font-mono truncate shrink-0" title={param.name}>
                    {param.name}
                    {param.required && <span className="text-destructive ml-0.5">*</span>}
                  </Label>
                  <Input
                    value={testParams[param.name] || ''}
                    onChange={(e) => updateParam(param.name, e.target.value)}
                    placeholder={param.description || `${t('tools.valueFor')} ${param.name}`}
                    className="flex-1 text-sm h-8"
                    type={param.type === 'number' ? 'number' : 'text'}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Button */}
        <Button
          type="button"
          onClick={handleTest}
          disabled={testing || !canTest}
          variant="secondary"
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {t('tools.testingInProgress')}
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              {t('tools.runTest')}
            </>
          )}
        </Button>

        {/* Result Display */}
        {result && (
          <div className={cn(
            "p-3 rounded-lg border text-sm",
            result.success 
              ? "bg-emerald-500/10 border-emerald-500/30" 
              : "bg-destructive/10 border-destructive/30"
          )}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <span className={cn(
                "font-medium",
                result.success ? "text-emerald-500" : "text-destructive"
              )}>
                {result.success ? t('tools.testSuccess') : t('tools.testError')}
              </span>
              {result.duration_ms && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {result.duration_ms}ms
                </span>
              )}
            </div>

            {/* Warning */}
            {result.warning && (
              <div className="flex items-start gap-2 mb-2 text-yellow-500">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="text-xs">{result.warning}</span>
              </div>
            )}

            {/* Error Message */}
            {result.error && (
              <p className="text-xs text-destructive break-all">{result.error}</p>
            )}

            {/* Result Data */}
            {result.success && result.result !== undefined && (
              <ScrollArea className="max-h-[200px]">
                <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-background/50 rounded p-2 mt-2">
                  {typeof result.result === 'string' 
                    ? result.result 
                    : JSON.stringify(result.result, null, 2)
                  }
                </pre>
              </ScrollArea>
            )}

            {/* Full Response (if path extraction failed) */}
            {result.full_response && (
              <details className="mt-2">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  {t('tools.fullResponse')}
                </summary>
                <ScrollArea className="max-h-[150px] mt-1">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-background/50 rounded p-2">
                    {JSON.stringify(result.full_response, null, 2)}
                  </pre>
                </ScrollArea>
              </details>
            )}

            {/* Error Response Body */}
            {result.response_body && (
              <details className="mt-2">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  {t('tools.responseBody')}
                </summary>
                <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-background/50 rounded p-2 mt-1">
                  {result.response_body}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Help Text */}
        {!result && (
          <p className="text-xs text-muted-foreground">
            {t('tools.testHelpText')}
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
