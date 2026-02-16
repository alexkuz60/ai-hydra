import { getModelRegistryEntry } from '@/config/modelRegistry';

/** Models that use reasoning tokens (need higher limits) */
export const THINKING_MODELS = [
  'google/gemini-2.5-pro', 'google/gemini-3-pro-preview',
  'openai/gpt-5', 'openai/gpt-5.2', 'deepseek-reasoner',
  'gemini-2.5-pro', 'o1', 'o1-mini', 'o3-mini',
  'proxyapi/gpt-5', 'proxyapi/gpt-5.2',
];

export function isThinkingModel(modelId: string): boolean {
  return THINKING_MODELS.some(m => modelId.includes(m) || m.includes(modelId));
}

/** Localized competency names */
export const COMPETENCY_I18N: Record<string, { ru: string; en: string }> = {
  // archivist
  knowledge_management: { ru: 'Управление знаниями', en: 'Knowledge Management' },
  experience_distillation: { ru: 'Дистилляция опыта', en: 'Experience Distillation' },
  cataloging: { ru: 'Каталогизация', en: 'Cataloging' },
  // analyst
  pattern_recognition: { ru: 'Распознавание паттернов', en: 'Pattern Recognition' },
  specification_writing: { ru: 'Написание ТЗ', en: 'Specification Writing' },
  methodology: { ru: 'Методология', en: 'Methodology' },
  // webhunter
  query_formulation: { ru: 'Формулирование запросов', en: 'Query Formulation' },
  source_assessment: { ru: 'Оценка источников', en: 'Source Assessment' },
  // promptengineer
  optimization: { ru: 'Оптимизация', en: 'Optimization' },
  template_creation: { ru: 'Создание шаблонов', en: 'Template Creation' },
  diagnosis: { ru: 'Диагностика', en: 'Diagnosis' },
  // flowregulator
  architecture: { ru: 'Архитектура', en: 'Architecture' },
  // toolsmith
  api_design: { ru: 'Проектирование API', en: 'API Design' },
  planning: { ru: 'Планирование', en: 'Planning' },
  // guide
  onboarding: { ru: 'Онбординг', en: 'Onboarding' },
  documentation: { ru: 'Документация', en: 'Documentation' },
  // critic
  error_detection: { ru: 'Обнаружение ошибок', en: 'Error Detection' },
  prompt_review: { ru: 'Обзор промпта', en: 'Prompt Review' },
  bias_analysis: { ru: 'Анализ предвзятостей', en: 'Bias Analysis' },
  // moderator
  mediation: { ru: 'Медиация', en: 'Mediation' },
  facilitation: { ru: 'Фасилитация', en: 'Facilitation' },
  quality_assessment: { ru: 'Оценка качества', en: 'Quality Assessment' },
  // advisor
  strategic_thinking: { ru: 'Стратегическое мышление', en: 'Strategic Thinking' },
  risk_analysis: { ru: 'Анализ рисков', en: 'Risk Analysis' },
  // consultant
  domain_expertise: { ru: 'Предметная экспертиза', en: 'Domain Expertise' },
  comparative_analysis: { ru: 'Сравнительный анализ', en: 'Comparative Analysis' },
  practical_guidance: { ru: 'Практическое руководство', en: 'Practical Guidance' },
  // assistant
  deep_analysis: { ru: 'Глубокий анализ', en: 'Deep Analysis' },
  creative_problem_solving: { ru: 'Креативное решение проблем', en: 'Creative Problem Solving' },
  multi_perspective_analysis: { ru: 'Многоракурсный анализ', en: 'Multi-Perspective Analysis' },
  // arbiter
  decision_synthesis: { ru: 'Синтез решений', en: 'Decision Synthesis' },
  objective_evaluation: { ru: 'Объективная оценка', en: 'Objective Evaluation' },
  fairness_assessment: { ru: 'Оценка справедливости', en: 'Fairness Assessment' },
  // generic
  self_awareness: { ru: 'Самоанализ', en: 'Self-Awareness' },
  teamwork: { ru: 'Командная работа', en: 'Teamwork' },
};

export function getCompetencyLabel(key: string, isRu: boolean): string {
  const entry = COMPETENCY_I18N[key];
  if (entry) return isRu ? entry.ru : entry.en;
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/** Parse pricing string like '$0.15' or '≈$0.15' to number (per 1M tokens) */
function parsePricePerMillion(priceStr: string): number {
  const cleaned = priceStr.replace(/[≈$,]/g, '').trim();
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

/** Calculate estimated cost from token count and model pricing */
export function estimateCost(modelId: string, tokenCount: number): { input: number; output: number; total: number } | null {
  const entry = getModelRegistryEntry(modelId);
  if (!entry || typeof entry.pricing === 'string') return null;
  const inputPrice = parsePricePerMillion(entry.pricing.input);
  const outputPrice = parsePricePerMillion(entry.pricing.output);
  // Interview tokens are mostly output (model generates), estimate 10% input / 90% output
  const inputTokens = Math.round(tokenCount * 0.1);
  const outputTokens = Math.round(tokenCount * 0.9);
  const inputCost = (inputTokens / 1_000_000) * inputPrice;
  const outputCost = (outputTokens / 1_000_000) * outputPrice;
  return { input: inputCost, output: outputCost, total: inputCost + outputCost };
}

export function formatCost(cost: number): string {
  if (cost < 0.001) return '<$0.001';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(3)}`;
}
