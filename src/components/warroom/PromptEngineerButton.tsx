import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Wand2, Loader2, Sparkles, Copy, Check, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PromptEngineerButtonProps {
  currentInput: string;
  onOptimizedPrompt: (optimizedText: string) => void;
  disabled?: boolean;
}

interface OptimizationResult {
  optimizedPrompt: string;
  explanation: string;
  improvements: string[];
}

export function PromptEngineerButton({
  currentInput,
  onOptimizedPrompt,
  disabled = false,
}: PromptEngineerButtonProps) {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleOptimize = async () => {
    if (!currentInput.trim()) {
      toast.error(t('promptEngineer.emptyInput'));
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const systemPrompt = `Вы - Промпт-Инженер системы Hydra, специализирующийся на оптимизации промптов для ИИ-систем.

Ваша задача — улучшить пользовательский запрос, сделав его:
1. Более структурированным и понятным для ИИ
2. Более конкретным с чёткими критериями успеха
3. Содержащим необходимый контекст

Ответьте СТРОГО в формате JSON:
{
  "optimizedPrompt": "улучшенный текст запроса",
  "explanation": "краткое объяснение изменений (1-2 предложения)",
  "improvements": ["улучшение 1", "улучшение 2", "улучшение 3"]
}

Не добавляйте markdown-разметку, только чистый JSON.`;

      // Use fetch directly to handle SSE stream
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/hydra-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          message: `Оптимизируй следующий запрос:\n\n${currentInput}`,
          model_id: 'google/gemini-2.5-flash',
          role: 'assistant',
          system_prompt: systemPrompt,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Parse SSE stream and collect full response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process SSE lines
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) fullContent += content;
          } catch {
            // Incomplete JSON, re-buffer
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Clean potential markdown code blocks
      let content = fullContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const parsed: OptimizationResult = JSON.parse(content);
      setResult(parsed);
    } catch (error: any) {
      console.error('Prompt optimization error:', error);
      toast.error(t('promptEngineer.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onOptimizedPrompt(result.optimizedPrompt);
      setDialogOpen(false);
      setResult(null);
      toast.success(t('promptEngineer.applied'));
    }
  };

  const handleCopy = async () => {
    if (result) {
      await navigator.clipboard.writeText(result.optimizedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenDialog = () => {
    if (!currentInput.trim()) {
      toast.error(t('promptEngineer.emptyInput'));
      return;
    }
    setDialogOpen(true);
    setResult(null);
    // Auto-start optimization when dialog opens
    setTimeout(() => handleOptimize(), 100);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenDialog}
            disabled={disabled || !currentInput.trim()}
            className={cn(
              "h-10 w-10 shrink-0",
              currentInput.trim() && "text-hydra-promptengineer hover:text-hydra-promptengineer/80 hover:bg-hydra-promptengineer/10"
            )}
          >
            <Wand2 className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {t('promptEngineer.buttonTooltip')}
        </TooltipContent>
      </Tooltip>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-hydra-promptengineer" />
              {t('promptEngineer.title')}
            </DialogTitle>
            <DialogDescription>
              {t('promptEngineer.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Original prompt */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t('promptEngineer.original')}
              </label>
              <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm">
                {currentInput}
              </div>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-hydra-promptengineer" />
                  <span className="text-sm text-muted-foreground">
                    {t('promptEngineer.optimizing')}
                  </span>
                </div>
              </div>
            )}

            {/* Result */}
            {result && !loading && (
              <div className="space-y-4">
                {/* Optimized prompt */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-hydra-promptengineer" />
                      {t('promptEngineer.optimized')}
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className="h-7 px-2"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  <ScrollArea className="max-h-[200px]">
                    <div className="p-3 rounded-lg bg-hydra-promptengineer/10 border border-hydra-promptengineer/30 text-sm whitespace-pre-wrap">
                      {result.optimizedPrompt}
                    </div>
                  </ScrollArea>
                </div>

                {/* Explanation */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('promptEngineer.explanation')}
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {result.explanation}
                  </p>
                </div>

                {/* Improvements */}
                {result.improvements.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('promptEngineer.improvements')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {result.improvements.map((improvement, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-hydra-promptengineer/10 text-hydra-promptengineer border-hydra-promptengineer/30"
                        >
                          {improvement}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            {result && (
              <Button
                onClick={handleApply}
                className="bg-hydra-promptengineer hover:bg-hydra-promptengineer/90"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                {t('promptEngineer.apply')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
