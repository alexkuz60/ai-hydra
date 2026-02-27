/**
 * Interview Plugin: Экскурсовод (Guide)
 *
 * Tests the candidate's ability to create interactive tours,
 * explain platform features clearly, and maintain factual accuracy
 * against the Hydrapedia knowledge base.
 */

import type { RoleTestPlugin, RoleTestContext, RoleTestTask } from '@/types/interview';

/** Competency identifiers */
const C = {
  TOUR_DESIGN: 'tour_design',
  FEATURE_EXPLANATION: 'feature_explanation',
  KNOWLEDGE_ACCURACY: 'knowledge_accuracy',
  DEPTH_ADAPTATION: 'depth_adaptation',
  COLD_START: 'cold_start',
} as const;

/** Localized competency labels */
export const COMPETENCY_LABELS: Record<string, { ru: string; en: string }> = {
  [C.TOUR_DESIGN]: {
    ru: 'Проектирование туров',
    en: 'Tour Design',
  },
  [C.FEATURE_EXPLANATION]: {
    ru: 'Объяснение функций',
    en: 'Feature Explanation',
  },
  [C.KNOWLEDGE_ACCURACY]: {
    ru: 'Точность знаний',
    en: 'Knowledge Accuracy',
  },
  [C.DEPTH_ADAPTATION]: {
    ru: 'Адаптация глубины',
    en: 'Depth Adaptation',
  },
  [C.COLD_START]: {
    ru: 'Холодный старт',
    en: 'Cold Start',
  },
};

// ── Task generators ──

function tourDesignTask(ctx: RoleTestContext): RoleTestTask {
  const isRu = ctx.language === 'ru';
  return {
    task_type: 'tour_script',
    competency: C.TOUR_DESIGN,
    task_prompt: isRu
      ? `Спроектируй пошаговый сценарий экскурсии по разделу «Штат ролей» (маршрут /staff-roles).
Для каждого шага укажи:
1. CSS-селектор целевого элемента (data-guide атрибут или структурный селектор).
2. Заголовок и описание на русском и английском.
3. Действие (click/hover/none) и placement тултипа.
4. Задержку (delayMs), если элемент появляется после анимации.
Сценарий должен содержать 4–6 шагов и логично вести пользователя от общего обзора к деталям.`
      : `Design a step-by-step guided tour for the "Staff Roles" section (route /staff-roles).
For each step provide:
1. CSS selector for the target element (data-guide attribute or structural selector).
2. Title and description in both Russian and English.
3. Action (click/hover/none) and tooltip placement.
4. Delay (delayMs) if the element appears after an animation.
The scenario should contain 4–6 steps and logically guide the user from overview to details.`,
    baseline_source: { type: 'none' },
  };
}

function featureExplanationTask(ctx: RoleTestContext): RoleTestTask {
  const isRu = ctx.language === 'ru';
  return {
    task_type: 'explanation',
    competency: C.FEATURE_EXPLANATION,
    task_prompt: isRu
      ? `Объясни функцию «Конкурс красоты ИИ-интеллекта» (AI Intelligence Beauty Contest) двумя способами:
1. Для новичка, который впервые открыл платформу (максимум 3 предложения, без терминов).
2. Для опытного пользователя, который хочет понять внутреннюю механику (arbiter scoring, критерии, пайплайн).
Оба объяснения должны быть точными и не содержать вымышленных деталей.`
      : `Explain the "AI Intelligence Beauty Contest" feature in two ways:
1. For a beginner who just opened the platform (max 3 sentences, no jargon).
2. For an advanced user who wants to understand internal mechanics (arbiter scoring, criteria, pipeline).
Both explanations must be accurate and contain no fabricated details.`,
    baseline_source: { type: 'knowledge', query: 'contest beauty' },
  };
}

function knowledgeAccuracyTask(ctx: RoleTestContext): RoleTestTask {
  const isRu = ctx.language === 'ru';

  // Pick a random knowledge entry as the baseline for fact-checking
  const knowledgeSnippet = ctx.knowledgeEntries.length > 0
    ? ctx.knowledgeEntries[Math.floor(Math.random() * ctx.knowledgeEntries.length)]
    : null;

  const baselineHint = knowledgeSnippet
    ? `\n\nБазовый фрагмент для проверки:\n«${knowledgeSnippet.content.slice(0, 400)}…»`
    : '';

  return {
    task_type: 'fact_check',
    competency: C.KNOWLEDGE_ACCURACY,
    task_prompt: isRu
      ? `На основе базы знаний Гидрапедии ответь на следующий вопрос пользователя:
«Какие типы узлов поддерживает редактор потоков и для чего каждый из них используется?»
Ответ должен быть фактически точным, структурированным (список) и ссылаться только на реально существующие узлы.${baselineHint}`
      : `Based on the Hydrapedia knowledge base, answer the following user question:
"What node types does the Flow Editor support and what is each one used for?"
The answer must be factually accurate, structured (list), and reference only actually existing nodes.${baselineHint}`,
    baseline_source: { type: 'knowledge', query: 'flow node types' },
  };
}

function depthAdaptationTask(ctx: RoleTestContext): RoleTestTask {
  const isRu = ctx.language === 'ru';
  return {
    task_type: 'adaptive_guide',
    competency: C.DEPTH_ADAPTATION,
    task_prompt: isRu
      ? `Пользователь спрашивает: «Как работает память ролей?»
Предоставь три варианта ответа с разной глубиной:
1. **Краткий** (1–2 предложения) — для быстрой справки.
2. **Стандартный** (абзац) — для понимания концепции.
3. **Глубокий** (детальное объяснение) — включая типы памяти, механизм embedding-поиска и связь с session_memory.
Каждый уровень должен быть самодостаточным и точным.`
      : `A user asks: "How does role memory work?"
Provide three answer variants with different depth levels:
1. **Brief** (1–2 sentences) — for quick reference.
2. **Standard** (paragraph) — for concept understanding.
3. **Deep** (detailed explanation) — including memory types, embedding search mechanism, and relation to session_memory.
Each level must be self-contained and accurate.`,
    baseline_source: { type: 'knowledge', query: 'role memory' },
  };
}

function coldStartTask(ctx: RoleTestContext): RoleTestTask {
  const isRu = ctx.language === 'ru';
  return {
    task_type: 'cold_start',
    competency: C.COLD_START,
    task_prompt: isRu
      ? `Представь, что в платформу добавлен новый раздел «Аналитика использования» (/analytics).
Твоя задача:
1. Напиши статью для Гидрапедии (300–500 слов) с описанием раздела, его возможностей и типичных сценариев использования.
2. Спроектируй сценарий экскурсии из 3–4 шагов для этого раздела (формат: selector, title, description, placement).
Контент должен быть логичным, полезным и соответствовать стилю существующих статей Гидрапедии.`
      : `Imagine a new "Usage Analytics" section (/analytics) has been added to the platform.
Your task:
1. Write a Hydrapedia article (300–500 words) describing the section, its capabilities, and typical use cases.
2. Design a tour scenario of 3–4 steps for this section (format: selector, title, description, placement).
Content must be logical, useful, and match the style of existing Hydrapedia articles.`,
    baseline_source: { type: 'none' },
  };
}

// ── Plugin ──

export const guidePlugin: RoleTestPlugin = {
  role: 'guide',

  generateTasks(ctx: RoleTestContext): RoleTestTask[] {
    return [
      tourDesignTask(ctx),
      featureExplanationTask(ctx),
      knowledgeAccuracyTask(ctx),
      depthAdaptationTask(ctx),
      coldStartTask(ctx),
    ];
  },

  getEvaluationHint(competency: string): string {
    switch (competency) {
      case C.TOUR_DESIGN:
        return 'Evaluate CSS selector validity, logical step ordering, bilingual quality, and appropriate use of actions/delays.';
      case C.FEATURE_EXPLANATION:
        return 'Check factual accuracy against Hydrapedia, appropriate complexity for each audience level, and absence of hallucinated features.';
      case C.KNOWLEDGE_ACCURACY:
        return 'Verify every mentioned node type actually exists in the platform. Penalize any fabricated or missing nodes heavily.';
      case C.DEPTH_ADAPTATION:
        return 'Assess whether each depth level is self-contained, accurate, and appropriately detailed for its target audience.';
      case C.COLD_START:
        return 'Evaluate article structure, writing style consistency with Hydrapedia, tour step practicality, and creative quality.';
      default:
        return 'Evaluate response quality, accuracy, and relevance to the Guide role responsibilities.';
    }
  },
};
