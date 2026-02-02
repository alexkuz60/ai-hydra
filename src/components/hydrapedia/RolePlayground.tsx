import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { StreamingMessageCard } from '@/components/warroom/StreamingMessageCard';
import { 
  ROLE_CONFIG, 
  AGENT_ROLES, 
  DEFAULT_SYSTEM_PROMPTS,
  type AgentRole 
} from '@/config/roles';
import type { StreamingResponse } from '@/hooks/useStreamingResponses';
import { cn } from '@/lib/utils';
import { 
  ChevronDown, 
  ChevronUp, 
  Send, 
  Square, 
  LogIn, 
  Gamepad2,
  AlertCircle
} from 'lucide-react';

interface RolePlaygroundProps {
  className?: string;
}

const MAX_INPUT_LENGTH = 500;
const MODEL_ID = 'google/gemini-2.5-flash';

export function RolePlayground({ className }: RolePlaygroundProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  
  const [selectedRole, setSelectedRole] = useState<AgentRole>('assistant');
  const [userInput, setUserInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [response, setResponse] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const roleConfig = ROLE_CONFIG[selectedRole];
  const systemPrompt = DEFAULT_SYSTEM_PROMPTS[selectedRole];

  // Create StreamingResponse object for StreamingMessageCard
  const streamingResponse: StreamingResponse = useMemo(() => ({
    modelId: MODEL_ID,
    modelName: MODEL_ID.split('/')[1],
    role: selectedRole,
    content: response,
    isStreaming,
    startTime: Date.now(),
    elapsedSeconds: 0,
    status: 'confirmed' as const, // Use valid status from PendingResponseState
  }), [selectedRole, response, isStreaming]);

  const handleSend = useCallback(async () => {
    if (!userInput.trim() || isStreaming || !user) return;
    
    setIsStreaming(true);
    setResponse('');
    setError(null);
    
    abortControllerRef.current = new AbortController();
    
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hydra-stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            message: userInput,
            model_id: MODEL_ID,
            role: selectedRole,
            system_prompt: systemPrompt,
            temperature: 0.7,
            max_tokens: 2048,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!resp.ok) {
        if (resp.status === 429) {
          setError(t('hydrapedia.playground.rateLimitError'));
        } else if (resp.status === 402) {
          setError(t('hydrapedia.playground.paymentError'));
        } else {
          const errData = await resp.json().catch(() => ({}));
          setError(errData.error || t('hydrapedia.playground.genericError'));
        }
        setIsStreaming(false);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) {
        setError(t('hydrapedia.playground.genericError'));
        setIsStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let textBuffer = '';
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullResponse += content;
              setResponse(fullResponse);
            }
          } catch {
            // Incomplete JSON, put it back
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
      
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // Cancelled by user
      } else {
        console.error('[RolePlayground] Error:', err);
        setError(t('hydrapedia.playground.genericError'));
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [userInput, isStreaming, user, selectedRole, systemPrompt, t]);

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Not logged in
  if (!user) {
    return (
      <div className={cn('my-6 p-6 border border-border rounded-lg bg-muted/30', className)}>
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <Gamepad2 className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">{t('hydrapedia.playground.loginRequired')}</p>
          <Button asChild>
            <a href="/login">
              <LogIn className="h-4 w-4 mr-2" />
              {t('nav.login')}
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('my-6 border border-border rounded-lg bg-card/50 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
        <Gamepad2 className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">{t('hydrapedia.playground.title')}</h3>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Role Selector */}
        <div className="flex flex-wrap gap-2">
          {AGENT_ROLES.map((role) => {
            const config = ROLE_CONFIG[role];
            const Icon = config.icon;
            const isSelected = selectedRole === role;
            
            return (
              <Button
                key={role}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRole(role)}
                className={cn(
                  'gap-1.5 transition-all',
                  isSelected && 'ring-2 ring-primary/50'
                )}
              >
                <Icon className={cn('h-4 w-4', !isSelected && config.color)} />
                <span className="text-xs">{t(config.label)}</span>
              </Button>
            );
          })}
        </div>
        
        {/* System Prompt Collapsible */}
        <Collapsible open={showPrompt} onOpenChange={setShowPrompt}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              {showPrompt ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {t('hydrapedia.playground.systemPrompt')}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 p-3 rounded-md bg-muted/50 text-sm text-muted-foreground font-mono whitespace-pre-wrap">
              {systemPrompt}
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Input Area */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('hydrapedia.playground.yourQuery')}</label>
          <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value.slice(0, MAX_INPUT_LENGTH))}
            onKeyDown={handleKeyDown}
            placeholder={t('hydrapedia.playground.placeholder')}
            className="min-h-[80px] resize-none"
            disabled={isStreaming}
          />
          <div className="flex items-center justify-between">
            <span className={cn(
              'text-xs',
              userInput.length >= MAX_INPUT_LENGTH ? 'text-destructive' : 'text-muted-foreground'
            )}>
              {userInput.length}/{MAX_INPUT_LENGTH}
            </span>
            {isStreaming ? (
              <Button onClick={handleStop} variant="destructive" size="sm">
                <Square className="h-4 w-4 mr-1" />
                {t('hydrapedia.playground.stop')}
              </Button>
            ) : (
              <Button onClick={handleSend} disabled={!userInput.trim()} size="sm">
                <Send className="h-4 w-4 mr-1" />
                {t('hydrapedia.playground.send')}
              </Button>
            )}
          </div>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        
        {/* Response Area - using StreamingMessageCard from chat */}
        {(response || isStreaming) && (
          <StreamingMessageCard
            response={streamingResponse}
            onStop={handleStop ? () => handleStop() : undefined}
          />
        )}
      </div>
    </div>
  );
}
