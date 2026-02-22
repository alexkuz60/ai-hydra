/**
 * Translator Interview Plugin
 * 
 * Implements RoleTestPlugin for the 'translator' role.
 * Tests core bilingual translation competencies:
 * 1. Technical Translation — preserve domain terminology and structure
 * 2. Terminology Consistency — maintain Hydra glossary across passages
 * 3. Semantic Preservation — meaning equivalence (cosine similarity proxy)
 * 4. Tone & Register Fidelity — match formality and style
 * 5. Bidirectional Fluency — EN→RU quality (reverse direction)
 */

import type { RoleTestPlugin, RoleTestContext, RoleTestTask } from '@/types/interview';

// ── Localized competency labels ──

export const COMPETENCY_LABELS: Record<string, { ru: string; en: string }> = {
  technical_translation: { ru: 'Технический перевод', en: 'Technical Translation' },
  terminology_consistency: { ru: 'Единство терминологии', en: 'Terminology Consistency' },
  semantic_preservation: { ru: 'Сохранение смысла', en: 'Semantic Preservation' },
  tone_fidelity: { ru: 'Верность тона', en: 'Tone & Register Fidelity' },
  bidirectional_fluency: { ru: 'Двунаправленная беглость', en: 'Bidirectional Fluency' },
};

// ── Plugin Implementation ──

export const translatorPlugin: RoleTestPlugin = {
  role: 'translator',

  generateTasks(context: RoleTestContext): RoleTestTask[] {
    const { language } = context;
    const isRu = language === 'ru';
    const tasks: RoleTestTask[] = [];

    // ── Task 1: Technical Translation (RU → EN) ──
    tasks.push({
      task_type: 'technical_translation',
      competency: 'technical_translation',
      task_prompt: isRu
        ? `Переведи следующий технический текст с русского на английский, сохраняя структуру, форматирование Markdown и точность терминологии:\n\n"## Штатные роли\n\nВ системе AI-Hydra штатные роли — это ИИ-эксперты, назначенные на конкретные должности через процедуру собеседования. Каждая роль имеет свой промпт-контракт, базу знаний и поведенческий паттерн. Модель, прошедшая собеседование и получившая положительный вердикт Техно-арбитра, зачисляется в штат и получает доступ к ролевой памяти.\n\nОсновные категории:\n- **Консультанты** — участвуют в экспертных панелях и D-Chat\n- **Технический персонал (ОТК)** — автоматизированные функции контроля качества\n- **Архивариус** — управление RAG-памятью и хрониками"\n\nТребования:\n1. Сохрани Markdown-разметку (заголовки, жирный, списки)\n2. Используй устоявшуюся терминологию Hydra (Staff Roles, prompt contract, knowledge base, behavioral pattern, Techno-Arbiter, role memory, Expert Panel, D-Chat, QC Department, Archivist, RAG memory, chronicles)\n3. Обеспечь естественное звучание на английском без дословного перевода\n4. Сохрани информационную полноту — ничего не добавляй и не опускай`
        : `Translate the following technical text from Russian to English, preserving Markdown structure, formatting, and terminology accuracy:\n\n"## Штатные роли\n\nВ системе AI-Hydra штатные роли — это ИИ-эксперты, назначенные на конкретные должности через процедуру собеседования. Каждая роль имеет свой промпт-контракт, базу знаний и поведенческий паттерн. Модель, прошедшая собеседование и получившая положительный вердикт Техно-арбитра, зачисляется в штат и получает доступ к ролевой памяти.\n\nОсновные категории:\n- **Консультанты** — участвуют в экспертных панелях и D-Chat\n- **Технический персонал (ОТК)** — автоматизированные функции контроля качества\n- **Архивариус** — управление RAG-памятью и хрониками"\n\nRequirements:\n1. Preserve Markdown markup (headings, bold, lists)\n2. Use established Hydra terminology (Staff Roles, prompt contract, knowledge base, behavioral pattern, Techno-Arbiter, role memory, Expert Panel, D-Chat, QC Department, Archivist, RAG memory, chronicles)\n3. Ensure natural English without word-for-word translation\n4. Preserve informational completeness — add nothing, omit nothing`,
      baseline_source: { type: 'none' },
    });

    // ── Task 2: Terminology Consistency ──
    tasks.push({
      task_type: 'terminology_consistency',
      competency: 'terminology_consistency',
      task_prompt: isRu
        ? `Переведи три отдельных фрагмента текста Hydra на английский язык. Главная задача — обеспечить абсолютное единство терминологии между всеми тремя переводами.\n\nФрагмент A:\n"Техно-арбитр проводит финальную оценку кандидата после прохождения всех тестовых заданий собеседования. Его вердикт определяет, будет ли модель зачислена в штат на данную роль."\n\nФрагмент B:\n"В случае расхождения оценок между Техно-критиком и Техно-арбитром запускается процедура дискрепанс-триггера. Техно-модератор формирует итоговое заключение."\n\nФрагмент C:\n"Архивариус фиксирует результат собеседования в хрониках. Если вердикт Техно-арбитра положительный, в историю назначений добавляется запись о зачислении в штат."\n\nТребования:\n1. Один и тот же русский термин ВСЕГДА должен переводиться одинаково во всех фрагментах\n2. Приложи таблицу «Термин RU → Термин EN» для всех ключевых понятий\n3. Объясни выбор перевода для неочевидных терминов`
        : `Translate three separate Hydra text fragments to English. The main goal is to ensure absolute terminology consistency across all three translations.\n\nFragment A:\n"Техно-арбитр проводит финальную оценку кандидата после прохождения всех тестовых заданий собеседования. Его вердикт определяет, будет ли модель зачислена в штат на данную роль."\n\nFragment B:\n"В случае расхождения оценок между Техно-критиком и Техно-арбитром запускается процедура дискрепанс-триггера. Техно-модератор формирует итоговое заключение."\n\nFragment C:\n"Архивариус фиксирует результат собеседования в хрониках. Если вердикт Техно-арбитра положительный, в историю назначений добавляется запись о зачислении в штат."\n\nRequirements:\n1. The same Russian term MUST always be translated identically across all fragments\n2. Provide a "Term RU → Term EN" table for all key concepts\n3. Explain translation choices for non-obvious terms`,
      baseline_source: { type: 'none' },
    });

    // ── Task 3: Semantic Preservation ──
    tasks.push({
      task_type: 'semantic_preservation',
      competency: 'semantic_preservation',
      task_prompt: isRu
        ? `Переведи следующий системный промпт с русского на английский. Затем выполни обратный перевод (EN → RU) своего же результата. Сравни оригинал с обратным переводом и оцени потери смысла.\n\nОригинал:\n"Ты — Критик в системе AI-Hydra. Твоя задача — находить слабые места в ответах других моделей: логические ошибки, необоснованные утверждения, пропущенные альтернативы и скрытые предвзятости. Ты не предлагаешь собственных решений — только анализируешь чужие. Будь конструктивен: каждое замечание должно содержать конкретное объяснение проблемы и направление для улучшения."\n\nЗадача:\n1. Выполни перевод RU → EN\n2. Выполни обратный перевод EN → RU\n3. Построчно сравни оригинал и обратный перевод\n4. Оцени семантическую эквивалентность каждого предложения (0-10)\n5. Укажи, где произошли потери смысла и почему`
        : `Translate the following system prompt from Russian to English. Then perform a back-translation (EN → RU) of your own result. Compare the original with the back-translation and assess meaning loss.\n\nOriginal:\n"Ты — Критик в системе AI-Hydra. Твоя задача — находить слабые места в ответах других моделей: логические ошибки, необоснованные утверждения, пропущенные альтернативы и скрытые предвзятости. Ты не предлагаешь собственных решений — только анализируешь чужие. Будь конструктивен: каждое замечание должно содержать конкретное объяснение проблемы и направление для улучшения."\n\nTask:\n1. Translate RU → EN\n2. Back-translate EN → RU\n3. Line-by-line comparison of original and back-translation\n4. Rate semantic equivalence of each sentence (0-10)\n5. Identify where meaning was lost and why`,
      baseline_source: { type: 'none' },
    });

    // ── Task 4: Tone & Register Fidelity ──
    tasks.push({
      task_type: 'tone_fidelity',
      competency: 'tone_fidelity',
      task_prompt: isRu
        ? `Переведи один и тот же текст в трёх разных регистрах. Исходный текст (нейтральный тон):\n\n"Система AI-Hydra позволяет проводить конкурсы между ИИ-моделями. Несколько моделей одновременно получают одинаковое задание, после чего Арбитр оценивает качество ответов по заданным критериям. Результаты фиксируются в рейтинговой таблице."\n\nЗадача — переведи на английский в трёх вариантах:\n1. **Формальный/документационный** — для технической документации\n2. **Разговорный/маркетинговый** — для лендинга продукта\n3. **Академический** — для исследовательской статьи\n\nДля каждого варианта:\n- Сохрани полноту информации\n- Адаптируй лексику и синтаксис под регистр\n- Объясни, какие конкретно изменения сделал и почему`
        : `Translate the same text in three different registers. Source text (neutral tone):\n\n"Система AI-Hydra позволяет проводить конкурсы между ИИ-моделями. Несколько моделей одновременно получают одинаковое задание, после чего Арбитр оценивает качество ответов по заданным критериям. Результаты фиксируются в рейтинговой таблице."\n\nTask — translate to English in three variants:\n1. **Formal/documentation** — for technical documentation\n2. **Conversational/marketing** — for a product landing page\n3. **Academic** — for a research paper\n\nFor each variant:\n- Preserve informational completeness\n- Adapt vocabulary and syntax to the register\n- Explain what specific changes you made and why`,
      baseline_source: { type: 'none' },
    });

    // ── Task 5: Bidirectional Fluency (EN → RU) ──
    tasks.push({
      task_type: 'bidirectional_fluency',
      competency: 'bidirectional_fluency',
      task_prompt: isRu
        ? `Переведи следующий английский технический текст на русский язык, адаптируя его для русскоязычной аудитории Hydra:\n\n"The Interview Pipeline is a multi-phase evaluation process for AI model candidates. Phase 1 (Briefing) collects role knowledge, existing prompts, and behavioral patterns. Phase 2 (Testing) runs the candidate through role-specific tasks generated by interview plugins. Phase 3 (Verdict) triggers the Techno-Arbiter to produce a structured assessment with per-competency scores, an overall recommendation (hire/reject/conditional), and detailed justification.\n\nKey metrics tracked:\n- Response latency (ms)\n- Token consumption per task\n- Competency coverage across the role's duty matrix\n- Cosine similarity between candidate output and baseline (when available)"\n\nТребования:\n1. Используй принятую русскоязычную терминологию Hydra\n2. Не транслитерируй термины, которые имеют устоявшийся русский эквивалент\n3. Технические термины без русского эквивалента оставь на английском с пояснением в скобках при первом упоминании\n4. Сохрани форматирование (списки, скобки, единицы измерения)`
        : `Translate the following English technical text to Russian, adapting it for the Russian-speaking Hydra audience:\n\n"The Interview Pipeline is a multi-phase evaluation process for AI model candidates. Phase 1 (Briefing) collects role knowledge, existing prompts, and behavioral patterns. Phase 2 (Testing) runs the candidate through role-specific tasks generated by interview plugins. Phase 3 (Verdict) triggers the Techno-Arbiter to produce a structured assessment with per-competency scores, an overall recommendation (hire/reject/conditional), and detailed justification.\n\nKey metrics tracked:\n- Response latency (ms)\n- Token consumption per task\n- Competency coverage across the role's duty matrix\n- Cosine similarity between candidate output and baseline (when available)"\n\nRequirements:\n1. Use accepted Russian Hydra terminology\n2. Do not transliterate terms that have established Russian equivalents\n3. Technical terms without a Russian equivalent — keep in English with a parenthetical explanation on first mention\n4. Preserve formatting (lists, parentheses, units of measurement)`,
      baseline_source: { type: 'none' },
    });

    return tasks;
  },

  getEvaluationHint(competency: string): string {
    const hints: Record<string, string> = {
      technical_translation: 'Evaluate: Markdown preserved, Hydra glossary terms used correctly, natural English, no omissions/additions. Penalize: broken formatting, inconsistent terminology, literal translation artifacts.',
      terminology_consistency: 'Evaluate: same term always translated identically, complete glossary table, justified choices. Penalize: inconsistent translations of the same term, missing key terms in table.',
      semantic_preservation: 'Evaluate: back-translation closeness to original, identified meaning losses with explanations, high per-sentence equivalence scores. Penalize: unnoticed semantic drift, vague comparisons.',
      tone_fidelity: 'Evaluate: clear register differentiation, appropriate vocabulary for each variant, complete information preserved. Penalize: mixed registers, lost information, unexplained changes.',
      bidirectional_fluency: 'Evaluate: natural Russian, correct Hydra RU terminology, technical terms handled properly, formatting preserved. Penalize: unnecessary transliteration, lost nuance, broken structure.',
    };
    return hints[competency] || 'Evaluate translation accuracy, terminology consistency, and natural fluency.';
  },
};

export default translatorPlugin;
