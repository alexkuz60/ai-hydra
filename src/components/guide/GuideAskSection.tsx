import React, { useState, useCallback } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface GuideAskSectionProps {
  /** Current tour/step context for better answers */
  contextTitle?: string;
  contextDescription?: string;
  /** Callback to display answer in the explanation panel */
  onAnswer: (answer: string) => void;
}

export function GuideAskSection({ contextTitle, contextDescription, onAnswer }: GuideAskSectionProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = useCallback(async () => {
    if (!question.trim() || !user?.id || loading) return;

    setLoading(true);
    try {
      // 1. Search role_knowledge for relevant context
      let knowledgeContext = '';
      try {
        const embResp = await supabase.functions.invoke('generate-embeddings', {
          body: { texts: [question] },
        });
        if (!embResp.error && !embResp.data?.skipped && embResp.data?.embeddings?.[0]) {
          const { data: results } = await supabase.rpc('search_role_knowledge', {
            p_role: 'guide',
            p_query_embedding: embResp.data.embeddings[0],
            p_limit: 5,
            p_categories: ['hydrapedia'],
          });
          if (results && results.length > 0) {
            knowledgeContext = results.map((r: any) => r.content).join('\n\n---\n\n');
          }
        }
      } catch {
        console.warn('[GuideAsk] Knowledge search skipped');
      }

      // 2. Build system prompt for guide
      const systemPrompt = language === 'ru'
        ? `Ты — Экскурсовод, помощник по платформе Hydra. Отвечай кратко, понятно и дружелюбно. Объясняй функционал простым языком.
${contextTitle ? `\nТекущий контекст экскурсии: ${contextTitle}` : ''}
${contextDescription ? `Описание шага: ${contextDescription}` : ''}
${knowledgeContext ? `\n\nБаза знаний:\n${knowledgeContext}` : ''}`
        : `You are the Guide, a platform assistant for Hydra. Answer briefly, clearly and friendly. Explain features in simple language.
${contextTitle ? `\nCurrent tour context: ${contextTitle}` : ''}
${contextDescription ? `Step description: ${contextDescription}` : ''}
${knowledgeContext ? `\n\nKnowledge base:\n${knowledgeContext}` : ''}`;

      // 3. Call hydra-stream (non-streaming for simplicity in overlay)
      const resp = await supabase.functions.invoke('hydra-stream', {
        body: {
          message: question,
          model_id: 'google/gemini-2.5-flash-lite',
          role: 'guide',
          system_prompt: systemPrompt,
          temperature: 0.5,
          max_tokens: 1024,
        },
      });

      if (resp.error) throw resp.error;

      // Read streamed response
      const reader = resp.data?.getReader?.();
      if (reader) {
        let fullText = '';
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          // Parse SSE
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content || parsed.content || '';
                fullText += delta;
              } catch {
                // Plain text chunk
                fullText += data;
              }
            }
          }
        }
        onAnswer(fullText.trim() || (language === 'ru' ? 'Не удалось получить ответ.' : 'Could not get an answer.'));
      } else {
        // Non-stream fallback
        const text = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
        onAnswer(text);
      }

      setQuestion('');
    } catch (err) {
      console.error('[GuideAsk] Error:', err);
      onAnswer(language === 'ru' ? 'Ошибка при обращении к Экскурсоводу.' : 'Error contacting the Guide.');
    } finally {
      setLoading(false);
    }
  }, [question, user?.id, loading, contextTitle, contextDescription, language, onAnswer]);

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Sparkles className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-hydra-guide/60" />
        <Input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); } }}
          placeholder={language === 'ru' ? 'Спросить Экскурсовода…' : 'Ask the Guide…'}
          className="h-8 text-xs pl-8 pr-2 bg-muted/30 border-hydra-guide/20 focus:border-hydra-guide/50"
          disabled={loading}
        />
      </div>
      <Button
        size="sm"
        className="h-8 px-3 bg-hydra-guide hover:bg-hydra-guide/90 text-white text-xs gap-1.5"
        onClick={handleAsk}
        disabled={loading || !question.trim()}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        {language === 'ru' ? 'Спросить' : 'Ask'}
      </Button>
    </div>
  );
}
