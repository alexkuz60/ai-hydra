import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ──────────────────────────────────────────────
// Hydra anatomy: describes the organism to the candidate
// ──────────────────────────────────────────────

const HYDRA_ANATOMY = `
# Анатомия AI-Hydra

## Миссия
AI-Hydra — многомодельная ИИ-платформа для коллегиального анализа. Гидра объединяет специализированных ИИ-агентов (ролей) для решения сложных задач пользователя. Для Пользователя Гидра — единый генеральный соавтор. Техперсонал работает на невидимом фронте, обеспечивая качество работы организма.

## Экспертный состав (5 ролей — видимы пользователю)
| Роль | Назначение |
|------|-----------|
| Эксперт (assistant) | Генерация первичных решений, глубокий анализ |
| Критик (critic) | Выявление слабых мест, конструктивный скептицизм |
| Арбитр (arbiter) | Синтез финального решения, объективная оценка |
| Консультант (consultant) | Глубокие разовые запросы, экспертные заключения |
| Модератор (moderator) | Агрегация итогов дискуссии, структурирование |
| Советник (advisor) | Стратегическое планирование, долгосрочные решения |
| Аналитик (analyst) | Анализ данных, выявление закономерностей |

## Технический персонал (8 ролей — невидимы пользователю)
| Роль | Назначение |
|------|-----------|
| Архивариус (archivist) | Управление библиотеками промптов, памятью сессий |
| Веб-Охотник (webhunter) | Поиск информации в интернете |
| Промпт-Инженер (promptengineer) | Оптимизация инструкций для ИИ-моделей |
| Логистик (flowregulator) | Архитектура data-flow диаграмм и пайплайнов |
| Инструментальщик (toolsmith) | Создание и настройка инструментов |
| Проводник (guide) | Навигация и обучение пользователя |

## Ключевой принцип
Техперсонал обслуживает организм Гидры невидимо для пользователя. Выполнение должностных обязанностей НЕ ДОЛЖНО потреблять больше токенов, чем ответы на запросы пользователя. Эффективность и экономичность — приоритет номер один.

## Иерархия
- Супервизор (пользователь с правами) → управляет Штатом
- Human-in-the-loop → ключевые решения утверждаются пользователем
- Табель о рангах → определяет полномочия и подчинённость ролей
`;

// ──────────────────────────────────────────────
// Role interaction map: who works with whom
// ──────────────────────────────────────────────

const ROLE_INTERACTIONS: Record<string, string[]> = {
  archivist: ['promptengineer', 'analyst', 'guide'],
  analyst: ['archivist', 'advisor', 'promptengineer'],
  webhunter: ['assistant', 'analyst', 'archivist'],
  promptengineer: ['archivist', 'flowregulator', 'toolsmith'],
  flowregulator: ['promptengineer', 'toolsmith', 'analyst'],
  toolsmith: ['promptengineer', 'flowregulator', 'webhunter'],
  guide: ['archivist', 'analyst', 'promptengineer'],
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

    const { role, candidate_model, source_contest_id } = await req.json();

    if (!role || !candidate_model) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: role, candidate_model" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[interview-briefing] Assembling brief for role=${role}, model=${candidate_model}`);

    // ── 1. Fetch role knowledge (full, no limits) ──
    const { data: knowledgeEntries } = await supabase
      .from('role_knowledge')
      .select('content, source_title, category, tags')
      .eq('role', role)
      .eq('user_id', user.id)
      .order('chunk_index', { ascending: true });

    // ── 2. Fetch predecessor experience from role_memory ──
    const { data: memoryEntries } = await supabase
      .from('role_memory')
      .select('content, memory_type, confidence_score, tags, metadata, usage_count')
      .eq('role', role)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // ── 3. Fetch role hierarchy (user's custom config) ──
    const { data: hierarchySettings } = await supabase
      .from('user_settings')
      .select('setting_value')
      .eq('user_id', user.id)
      .eq('setting_key', `role_hierarchy_${role}`)
      .maybeSingle();

    // ── 4. Fetch role behavior config ──
    const { data: behaviorConfig } = await supabase
      .from('role_behaviors')
      .select('communication, reactions, interactions, requires_approval')
      .eq('role', role)
      .or(`user_id.eq.${user.id},is_system.eq.true`)
      .order('is_system', { ascending: true })
      .limit(1)
      .maybeSingle();

    // ── 5. Assemble the Position Brief ──

    const sections: string[] = [];

    // Section A: Hydra Anatomy
    sections.push(HYDRA_ANATOMY);

    // Section B: Role-specific job description
    sections.push(`\n# Должностная инструкция: ${role}\n`);
    sections.push(`Ниже приводится полная должностная инструкция для позиции, на которую вы проходите собеседование.\n`);

    // Section C: Interaction map
    const neighbors = ROLE_INTERACTIONS[role] || [];
    if (neighbors.length > 0) {
      sections.push(`\n## Карта взаимодействий`);
      sections.push(`Ваши ближайшие коллеги по взаимодействию: **${neighbors.join(', ')}**`);
      sections.push(`Эффективная координация с ними — часть вашей работы.\n`);
    }

    // Section D: Role knowledge base
    if (knowledgeEntries && knowledgeEntries.length > 0) {
      sections.push(`\n## Профильная база знаний`);
      sections.push(`Ниже — специализированные знания, накопленные для этой роли:\n`);
      for (const entry of knowledgeEntries) {
        const title = entry.source_title ? `### ${entry.source_title}` : `### [${entry.category}]`;
        sections.push(`${title}\n${entry.content}\n`);
      }
    }

    // Section E: Predecessor experience (raw, unfiltered)
    if (memoryEntries && memoryEntries.length > 0) {
      sections.push(`\n## Опыт предшественников`);
      sections.push(`Ниже — записи опыта предыдущих сотрудников на этой позиции. Изучите их внимательно.\n`);
      
      const byType: Record<string, typeof memoryEntries> = {};
      for (const entry of memoryEntries) {
        const t = entry.memory_type || 'experience';
        if (!byType[t]) byType[t] = [];
        byType[t].push(entry);
      }

      const typeLabels: Record<string, string> = {
        experience: '📋 Опыт',
        success: '✅ Успешные кейсы',
        mistake: '⚠️ Ошибки и уроки',
        skill: '🎯 Навыки',
        preference: '⚙️ Предпочтения',
        briefing: '📄 Предыдущие брифинги',
      };

      for (const [type, entries] of Object.entries(byType)) {
        sections.push(`\n### ${typeLabels[type] || type}`);
        for (const e of entries) {
          const confidence = e.confidence_score ? ` (уверенность: ${(e.confidence_score * 100).toFixed(0)}%)` : '';
          const tags = e.tags && e.tags.length > 0 ? ` [${e.tags.join(', ')}]` : '';
          sections.push(`- ${e.content}${confidence}${tags}`);
        }
      }
    }

    // Section F: Behavior config
    if (behaviorConfig) {
      sections.push(`\n## Настройки поведения`);
      if (behaviorConfig.requires_approval) {
        sections.push(`⚠️ Ваши действия требуют одобрения Супервизора перед выполнением.`);
      }
      if (behaviorConfig.communication && typeof behaviorConfig.communication === 'object') {
        const comm = behaviorConfig.communication as Record<string, unknown>;
        if (comm.tone) sections.push(`- Тон коммуникации: **${comm.tone}**`);
        if (comm.verbosity) sections.push(`- Детализация: **${comm.verbosity}**`);
      }
    }

    // Section G: Hierarchy
    if (hierarchySettings?.setting_value) {
      sections.push(`\n## Иерархия (Табель о рангах)`);
      const hierarchy = hierarchySettings.setting_value as Record<string, unknown>;
      if (hierarchy.superiors && Array.isArray(hierarchy.superiors)) {
        sections.push(`- Вышестоящие: ${(hierarchy.superiors as string[]).join(', ')}`);
      }
      if (hierarchy.subordinates && Array.isArray(hierarchy.subordinates)) {
        sections.push(`- Подчинённые: ${(hierarchy.subordinates as string[]).join(', ')}`);
      }
    }

    const fullBrief = sections.join('\n');
    const estimatedTokens = Math.ceil(fullBrief.length / 4); // rough estimate

    console.log(`[interview-briefing] Brief assembled: ~${estimatedTokens} tokens, ${knowledgeEntries?.length || 0} knowledge entries, ${memoryEntries?.length || 0} memory entries`);

    // ── 6. Create interview session ──
    const { data: session, error: insertError } = await supabase
      .from('interview_sessions')
      .insert({
        user_id: user.id,
        role,
        candidate_model,
        status: 'briefing',
        briefing_token_count: estimatedTokens,
        briefing_data: {
          brief_text: fullBrief,
          knowledge_count: knowledgeEntries?.length || 0,
          memory_count: memoryEntries?.length || 0,
          has_hierarchy: !!hierarchySettings?.setting_value,
          has_behavior: !!behaviorConfig,
          assembled_at: new Date().toISOString(),
        },
        source_contest_id: source_contest_id || null,
        config: {
          version: 1,
          phase: 'briefing',
        },
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[interview-briefing] Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create interview session', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        session_id: session.id,
        briefing: fullBrief,
        estimated_tokens: estimatedTokens,
        stats: {
          knowledge_entries: knowledgeEntries?.length || 0,
          memory_entries: memoryEntries?.length || 0,
          has_hierarchy: !!hierarchySettings?.setting_value,
          has_behavior: !!behaviorConfig,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error('[interview-briefing] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
