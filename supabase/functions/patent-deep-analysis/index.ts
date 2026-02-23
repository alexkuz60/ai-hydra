import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { AnalysisRequest, DEFAULT_CONFIGS } from "./types.ts";
import { sseEvent } from "./sse.ts";
import { streamWithAdaptiveRetry } from "./streaming.ts";
import { synthesizeBestResponse } from "./synthesis.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: AnalysisRequest = await req.json();
    const { session_id, step_index, model_id, language = 'ru', collect_only = false } = body;
    const configs = body.configs?.length ? body.configs : DEFAULT_CONFIGS;

    if (!session_id || step_index === undefined || !model_id) {
      return new Response(
        JSON.stringify({ error: "Missing session_id, step_index, or model_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load interview session
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const testResults = (session.test_results as any);
    const steps = testResults?.steps as any[] || [];
    const targetStep = steps[step_index];

    if (!targetStep) {
      return new Response(
        JSON.stringify({ error: `Step ${step_index} not found in test_results` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const taskPrompt = targetStep.task_prompt;
    const baseline = targetStep.baseline?.current_value || '';
    const briefText = (session.briefing_data as any)?.brief_text || '';

    // Adversarial system prompt for devil's advocate pass
    const DEVILS_ADVOCATE_SYSTEM = language === 'ru'
      ? 'Ты — эксперт патентного ведомства с высоким процентом отклонений заявок. Твоя задача — найти ВСЕ причины для отказа. Не одобряй без глубочайшего анализа. Каждый одобренный без анализа элемент — профессиональная ошибка. Ищи: очевидные комбинации, отсутствие технического эффекта, абстрактные формулировки, программы для ЭВМ как таковые, бизнес-методы.'
      : 'You are a patent office expert known for a high rejection rate. Your task is to find ALL reasons for rejection. Do not approve without deepest analysis. Every element approved without analysis is a professional error. Look for: obvious combinations, lack of technical effect, abstract formulations, computer programs as such, business methods.';

    let fullPrompt = taskPrompt;
    if (baseline) {
      fullPrompt += `\n\n---\n## Текущее состояние (baseline):\n${baseline}`;
    }

    // ── SSE Stream ──
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(sseEvent(event, data)));
        };

        send('start', {
          session_id, step_index, model_id,
          total_configs: configs.length,
          configs: configs.map(c => ({ label: c.label, max_tokens: c.max_tokens, temperature: c.temperature })),
        });

        // Phase 1: Collect variants
        const variants: (typeof import("./types.ts"))["VariantResult"][] = [];

        for (let i = 0; i < configs.length; i++) {
          const config = configs[i];
          send('config_start', { config_index: i, label: config.label });

          const systemPromptForConfig = config.label === 'devils_advocate'
            ? DEVILS_ADVOCATE_SYSTEM
            : briefText;

          const variant = await streamWithAdaptiveRetry(
            supabaseUrl, supabaseKey, authHeader,
            fullPrompt, systemPromptForConfig, model_id, config, send,
          );

          variants.push(variant);

          send('config_complete', {
            config_index: i, label: config.label, status: variant.status,
            token_count: variant.token_count, elapsed_ms: variant.elapsed_ms,
            attempts: variant.attempts, text_length: variant.text.length,
          });
        }

        // Phase 2: Synthesis (unless collect_only)
        let synthesized: { text: string; token_count: number; elapsed_ms: number } | null = null;

        if (!collect_only && variants.filter(v => v.status !== 'failed').length > 1) {
          send('synthesis_start', { variant_count: variants.filter(v => v.status !== 'failed').length });

          synthesized = await synthesizeBestResponse(
            supabaseUrl, supabaseKey, authHeader,
            model_id, taskPrompt, variants, language,
          );

          send('synthesis_complete', {
            token_count: synthesized.token_count,
            elapsed_ms: synthesized.elapsed_ms,
            text_length: synthesized.text.length,
          });
        }

        // Save results
        const deepAnalysisResult = {
          step_index, model_id,
          configs: configs.map(c => ({ label: c.label, max_tokens: c.max_tokens, temperature: c.temperature })),
          variants: variants.map(v => ({
            label: v.config_label, status: v.status, token_count: v.token_count,
            elapsed_ms: v.elapsed_ms, attempts: v.attempts,
            text_length: v.text.length, text: v.text,
          })),
          synthesis: synthesized ? {
            text: synthesized.text,
            token_count: synthesized.token_count,
            elapsed_ms: synthesized.elapsed_ms,
          } : null,
          completed_at: new Date().toISOString(),
        };

        const existingConfig = (session.config as Record<string, unknown>) || {};
        const existingDeep = (existingConfig.deep_analysis as any[]) || [];
        existingDeep.push(deepAnalysisResult);

        await supabase
          .from('interview_sessions')
          .update({ config: { ...existingConfig, deep_analysis: existingDeep } })
          .eq('id', session_id);

        send('complete', {
          total_variants: variants.length,
          successful: variants.filter(v => v.status !== 'failed').length,
          has_synthesis: !!synthesized,
          total_elapsed_ms: variants.reduce((s, v) => s + v.elapsed_ms, 0) + (synthesized?.elapsed_ms || 0),
        });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (err: any) {
    console.error('[patent-deep-analysis] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
