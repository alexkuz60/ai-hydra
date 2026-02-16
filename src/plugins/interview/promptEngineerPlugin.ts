/**
 * Prompt Engineer Interview Plugin
 * 
 * Implements RoleTestPlugin for the 'promptengineer' role.
 * Generates 5 situational tasks that test core competencies:
 * 1. Optimization — reduce tokens while preserving quality
 * 2. Section Parsing — structure raw text using standard sections
 * 3. Localization — adapt prompts EN↔RU preserving variables
 * 4. Conflict Resolution — merge contradictory instructions
 * 5. Cold Start — generate a prompt from duties alone
 */

import type { RoleTestPlugin, RoleTestContext, RoleTestTask } from '@/types/interview';
import { parsePromptSections } from '@/lib/promptSectionParser';

// ── Localized competency labels ──

export const COMPETENCY_LABELS: Record<string, { ru: string; en: string }> = {
  optimization: { ru: 'Оптимизация промптов', en: 'Prompt Optimization' },
  section_parsing: { ru: 'Структурный разбор', en: 'Section Parsing' },
  localization: { ru: 'Локализация EN↔RU', en: 'Localization EN↔RU' },
  conflict_resolution: { ru: 'Разрешение конфликтов', en: 'Conflict Resolution' },
  cold_start: { ru: 'Создание с нуля', en: 'Cold Start Generation' },
};

// ── Helpers ──

/** Pick a random prompt from the library, preferring ones with actual content */
function pickBaselinePrompt(
  prompts: RoleTestContext['prompts'],
): { name: string; content: string } | null {
  const candidates = prompts.filter(p => p.content.length > 100);
  if (candidates.length === 0) return prompts[0] || null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/** Extract section structure summary for evaluation hints */
function describeSections(content: string): string {
  const parsed = parsePromptSections(content);
  if (parsed.sections.length === 0) return 'No structured sections detected';
  return parsed.sections
    .map(s => `[${s.isCustom ? 'custom' : s.key}] "${s.title}" (${s.content.length} chars)`)
    .join(', ');
}

// ── Plugin Implementation ──

export const promptEngineerPlugin: RoleTestPlugin = {
  role: 'promptengineer',

  generateTasks(context: RoleTestContext): RoleTestTask[] {
    const { prompts, duties, language } = context;
    const isRu = language === 'ru';
    const baseline = pickBaselinePrompt(prompts);
    const tasks: RoleTestTask[] = [];

    // ── Task 1: Optimization ──
    if (baseline) {
      const sectionInfo = describeSections(baseline.content);
      tasks.push({
        task_type: 'prompt_optimization',
        competency: 'optimization',
        task_prompt: isRu
          ? `Проанализируй системный промпт "${baseline.name}" (структура: ${sectionInfo}). Оптимизируй его:\n1. Сократи общий объём на 20-30% без потери ключевых инструкций\n2. Устрани повторы и расплывчатые формулировки\n3. Добавь 1-2 few-shot примера если уместно\n4. Сохрани структуру секций (## заголовки)\n\nВерни полный оптимизированный промпт.`
          : `Analyze the system prompt "${baseline.name}" (structure: ${sectionInfo}). Optimize it:\n1. Reduce total volume by 20-30% without losing key instructions\n2. Remove repetitions and vague formulations\n3. Add 1-2 few-shot examples if appropriate\n4. Preserve section structure (## headers)\n\nReturn the full optimized prompt.`,
        baseline_source: { type: 'prompt', query: baseline.name },
      });
    } else {
      // Fallback if no prompts exist
      tasks.push({
        task_type: 'prompt_optimization',
        competency: 'optimization',
        task_prompt: isRu
          ? `Системный промпт: "Ты — ассистент. Отвечай на вопросы пользователя. Будь полезен и точен. Не выдумывай факты. Отвечай структурированно. Будь вежлив."\n\nОптимизируй этот промпт: расширь до полноценного системного промпта с секциями (Идентичность, Компетенции, Методология, Формат, Ограничения). Сохрани суть, добавь конкретику.`
          : `System prompt: "You are an assistant. Answer user questions. Be helpful and accurate. Don't make up facts. Answer in a structured way. Be polite."\n\nOptimize this prompt: expand into a full system prompt with sections (Identity, Competencies, Methodology, Format, Limitations). Preserve the essence, add specifics.`,
        baseline_source: { type: 'none' },
      });
    }

    // ── Task 2: Section Parsing / Structuring ──
    tasks.push({
      task_type: 'section_parsing',
      competency: 'section_parsing',
      task_prompt: isRu
        ? `Вот неструктурированный промпт:\n\n"Ты аналитик данных. Умеешь работать с таблицами и графиками. Всегда проверяй данные на ошибки. Используй markdown для таблиц. Не делай выводов без данных. При работе с командой — передавай результаты Модератору. Если данных мало — запроси у пользователя. Начальник просит фокусироваться на трендах."\n\nСтруктурируй его в формат Hydra с секциями:\n- # Название роли\n- ## Идентичность\n- ## Компетенции\n- ## Методология\n- ## Формат ответов\n- ## Взаимодействие\n- ## Ограничения\n- ## Пожелания Супервизора\n\nРаспредели каждое предложение в правильную секцию. Дополни недостающие секции релевантным содержанием.`
        : `Here's an unstructured prompt:\n\n"You are a data analyst. You can work with tables and charts. Always check data for errors. Use markdown for tables. Don't draw conclusions without data. When working with the team — pass results to the Moderator. If data is insufficient — ask the user. The manager wants you to focus on trends."\n\nStructure it into the Hydra format with sections:\n- # Role Name\n- ## Identity\n- ## Competencies\n- ## Methodology\n- ## Response Format\n- ## Teamwork\n- ## Limitations\n- ## Supervisor Wishes\n\nDistribute each sentence into the correct section. Fill in missing sections with relevant content.`,
      baseline_source: { type: 'none' },
    });

    // ── Task 3: Localization ──
    if (baseline) {
      const sourceIsRu = /[а-яё]/i.test(baseline.content);
      tasks.push({
        task_type: 'prompt_localization',
        competency: 'localization',
        task_prompt: isRu
          ? `Адаптируй промпт "${baseline.name}" на ${sourceIsRu ? 'английский' : 'русский'} язык.\n\nТребования:\n1. Сохрани все переменные и плейсхолдеры ({{var}}, $role, etc.)\n2. Адаптируй идиомы, а не переводи буквально\n3. Сохрани структуру секций (## заголовки)\n4. Сохрани техническую терминологию (few-shot, chain-of-thought, etc.) без перевода\n5. Адаптируй примеры под культурный контекст целевого языка`
          : `Adapt the prompt "${baseline.name}" to ${sourceIsRu ? 'English' : 'Russian'}.\n\nRequirements:\n1. Preserve all variables and placeholders ({{var}}, $role, etc.)\n2. Adapt idioms, don't translate literally\n3. Preserve section structure (## headers)\n4. Keep technical terminology (few-shot, chain-of-thought, etc.) untranslated\n5. Adapt examples to the cultural context of the target language`,
        baseline_source: { type: 'prompt', query: baseline.name },
      });
    } else {
      tasks.push({
        task_type: 'prompt_localization',
        competency: 'localization',
        task_prompt: isRu
          ? `Переведи на английский, сохраняя структуру и переменные:\n\n"# Критик\n## Идентичность\nТы — Критик в системе {{system_name}}. Твоя миссия — находить слабые места.\n## Компетенции\n- Анализ логических ошибок\n- Проверка фактов\n## Ограничения\n- Критикуй идеи, не личности"`
          : `Translate to Russian, preserving structure and variables:\n\n"# Critic\n## Identity\nYou are a Critic in the {{system_name}} system. Your mission is to find weaknesses.\n## Competencies\n- Logical error analysis\n- Fact-checking\n## Limitations\n- Criticize ideas, not people"`,
        baseline_source: { type: 'none' },
      });
    }

    // ── Task 4: Conflict Resolution ──
    tasks.push({
      task_type: 'conflict_resolution',
      competency: 'conflict_resolution',
      task_prompt: isRu
        ? `Два промпта для роли Ассистента содержат противоречивые инструкции:\n\nПромпт А (от Супервизора): "Всегда давай развёрнутый ответ минимум на 500 слов. Включай все детали и edge-cases."\n\nПромпт Б (системный): "Будь лаконичен. Ответ не более 3 абзацев. Если пользователь не просит деталей — дай суть."\n\nЗадача:\n1. Идентифицируй конкретные точки конфликта\n2. Предложи объединённый промпт, разрешающий противоречия\n3. Добавь условную логику (если пользователь просит деталей → развёрнуто, иначе → кратко)\n4. Сохрани приоритет Супервизора, не нарушая удобство`
        : `Two prompts for the Assistant role contain contradictory instructions:\n\nPrompt A (from Supervisor): "Always give a detailed answer of at least 500 words. Include all details and edge-cases."\n\nPrompt B (system): "Be concise. No more than 3 paragraphs. If the user doesn't ask for details — give the essence."\n\nTask:\n1. Identify specific conflict points\n2. Propose a merged prompt resolving contradictions\n3. Add conditional logic (if user asks for details → detailed, otherwise → concise)\n4. Preserve Supervisor priority without compromising usability`,
      baseline_source: { type: 'none' },
    });

    // ── Task 5: Cold Start ──
    const dutiesList = duties.length > 0
      ? duties.join(', ')
      : isRu ? 'анализ данных, построение графиков, выявление трендов' : 'data analysis, chart building, trend identification';

    tasks.push({
      task_type: 'cold_start',
      competency: 'cold_start',
      task_prompt: isRu
        ? `Создай полноценный системный промпт для новой роли "Ревизор" (Quality Auditor) с нуля.\n\nИзвестные обязанности: ${dutiesList}\n\nТребования:\n1. Используй стандартную структуру Hydra: # Название → ## Идентичность → ## Компетенции → ## Методология → ## Формат ответов → ## Взаимодействие → ## Ограничения → ## Пожелания Супервизора\n2. Каждая секция — минимум 3 пункта\n3. Методология должна быть пошаговой (numbered list)\n4. Ограничения — конкретные, не абстрактные\n5. Взаимодействие — учти существующие роли Hydra (Эксперт, Критик, Арбитр, Модератор)`
        : `Create a full system prompt for a new role "Quality Auditor" from scratch.\n\nKnown duties: ${dutiesList}\n\nRequirements:\n1. Use standard Hydra structure: # Title → ## Identity → ## Competencies → ## Methodology → ## Response Format → ## Teamwork → ## Limitations → ## Supervisor Wishes\n2. Each section — minimum 3 points\n3. Methodology must be step-by-step (numbered list)\n4. Limitations — specific, not abstract\n5. Teamwork — consider existing Hydra roles (Expert, Critic, Arbiter, Moderator)`,
      baseline_source: { type: 'none' },
    });

    return tasks;
  },

  getEvaluationHint(competency: string): string {
    const hints: Record<string, string> = {
      optimization: 'Evaluate: token reduction %, preserved instruction coverage, added few-shot quality. Penalize: loss of critical instructions, broken section structure.',
      section_parsing: 'Evaluate: correct sentence-to-section mapping, completeness of filled sections, proper ## formatting. Penalize: sentences in wrong sections, empty mandatory sections.',
      localization: 'Evaluate: natural target language, preserved variables/placeholders, adapted idioms, kept technical terms. Penalize: literal translations, lost variables, translated technical terms.',
      conflict_resolution: 'Evaluate: identified all conflicts, logical merge strategy, conditional logic quality, supervisor priority preserved. Penalize: ignoring one source entirely, no conditional logic.',
      cold_start: 'Evaluate: all 7 sections present and filled, methodology is numbered, limitations are specific, teamwork references real Hydra roles. Penalize: missing sections, generic/vague content.',
    };
    return hints[competency] || 'Evaluate overall quality, structure, and relevance.';
  },
};

export default promptEngineerPlugin;
