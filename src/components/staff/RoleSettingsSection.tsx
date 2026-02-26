import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ClipboardCheck, Bot, Lightbulb } from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { useTechRoleDefaults } from '@/hooks/useTechRoleDefaults';
import { ModelSelector } from '@/components/warroom/ModelSelector';
import type { AgentRole } from '@/config/roles';
import { s } from './i18n';

const MODEL_CHOICE_RATIONALE: Record<string, { ru: string; en: string }> = {
  assistant: {
    ru: 'Gemini 2.5 Pro — сильные аналитические и генеративные способности. Идеальный баланс глубины и универсальности для роли первичного эксперта.',
    en: 'Gemini 2.5 Pro — strong analytical and generative capabilities. Ideal balance of depth and versatility for the primary expert role.',
  },
  critic: {
    ru: 'GPT-5 — высочайшая точность рассуждений для выявления логических изъянов. Превосходит аналоги в детальном анализе аргументации.',
    en: 'GPT-5 — top-tier reasoning precision for detecting logical flaws. Excels at detailed argumentation analysis.',
  },
  arbiter: {
    ru: 'GPT-5 — объективный синтез множественных точек зрения. Сильнейшая модель для взвешенного принятия решений и разрешения противоречий.',
    en: 'GPT-5 — objective synthesis of multiple viewpoints. Strongest model for balanced decision-making and conflict resolution.',
  },
  consultant: {
    ru: 'Gemini 2.5 Pro — глубокая экспертиза для изолированных запросов. Большой контекст позволяет дать исчерпывающий ответ за один раз.',
    en: 'Gemini 2.5 Pro — deep expertise for isolated queries. Large context window enables comprehensive single-turn answers.',
  },
  moderator: {
    ru: 'Gemini 2.5 Flash — быстрая обработка и суммаризация дискуссий. Оптимальная скорость для оперативного обобщения ключевых тезисов.',
    en: 'Gemini 2.5 Flash — fast processing and discussion summarization. Optimal speed for promptly distilling key points.',
  },
  advisor: {
    ru: 'Gemini 2.5 Pro — практичные рекомендации требуют глубокого понимания контекста. Большой контекст и аналитика обеспечивают качественные советы.',
    en: 'Gemini 2.5 Pro — practical recommendations require deep contextual understanding. Large context and analytics ensure quality advice.',
  },
  archivist: {
    ru: 'Gemini 2.5 Flash — баланс скорости и качества для суммаризации и поиска по архивам. Хорошо справляется с большими контекстами при умеренной стоимости.',
    en: 'Gemini 2.5 Flash — balanced speed and quality for summarization and archive retrieval. Handles large contexts well at moderate cost.',
  },
  analyst: {
    ru: 'Gemini 2.5 Pro — сильнейшие аналитические способности в линейке Gemini. Лучший выбор для сложных метрик и многошагового рассуждения.',
    en: 'Gemini 2.5 Pro — strongest analytical capabilities in the Gemini lineup. Best choice for complex metrics and multi-step reasoning.',
  },
  promptengineer: {
    ru: 'GPT-5 — высочайшая языковая точность для работы с промптами. Превосходит аналоги в тонкостях формулировок и структурировании инструкций.',
    en: 'GPT-5 — top-tier linguistic precision for prompt engineering. Excels at nuanced phrasing and instruction structuring.',
  },
  flowregulator: {
    ru: 'Gemini 3 Flash Preview — быстрый структурный анализ потоков. Новое поколение модели обеспечивает лучшее понимание зависимостей при низкой задержке.',
    en: 'Gemini 3 Flash Preview — fast structural flow analysis. Next-gen model provides better dependency understanding at low latency.',
  },
  toolsmith: {
    ru: 'GPT-5 Mini — надёжная генерация кода при умеренной стоимости. Оптимальный баланс для создания и отладки инструментов без переплат.',
    en: 'GPT-5 Mini — reliable code generation at moderate cost. Optimal balance for building and debugging tools without overpaying.',
  },
  guide: {
    ru: 'Gemini 2.5 Flash Lite — самая быстрая и дешёвая модель. Идеальна для FAQ и навигационных подсказок, где скорость важнее глубины рассуждений.',
    en: 'Gemini 2.5 Flash Lite — fastest and cheapest model. Ideal for FAQ and navigation tips where speed matters more than deep reasoning.',
  },
  webhunter: {
    ru: 'Gemini 3 Flash Preview — быстрая мультимодальная обработка веб-контента. Хорошо извлекает данные из разнородных страниц при минимальных затратах.',
    en: 'Gemini 3 Flash Preview — fast multimodal web content processing. Efficiently extracts data from diverse pages at minimal cost.',
  },
  patent_attorney: {
    ru: 'Gemini 2.5 Pro — глубокий аналитический потенциал и встроенный веб-поиск (Grounding). Идеален для патентного анализа, где важны точность, большой контекст и доступ к актуальным источникам.',
    en: 'Gemini 2.5 Pro — deep analytical capabilities with built-in web search (Grounding). Ideal for patent analysis where accuracy, large context, and access to current sources matter.',
  },
};

interface RoleSettingsSectionProps {
  isTechnicalStaff: boolean;
  requiresApproval: boolean;
  isSaving: boolean;
  isLoading: boolean;
  userId?: string;
  selectedRole?: AgentRole | null;
  syncLoaded?: boolean;
  onSaveRequiresApproval: (checked: boolean) => Promise<boolean>;
}

export function RoleSettingsSection({ isTechnicalStaff, requiresApproval, isSaving, isLoading, userId, selectedRole, syncLoaded = true, onSaveRequiresApproval }: RoleSettingsSectionProps) {
  const { t, language } = useLanguage();
  const isRu = language === 'ru';
  const { getDefaultModel, setDefaultModel } = useTechRoleDefaults();

  const currentDefault = selectedRole ? getDefaultModel(selectedRole) : null;

  return (
    <>
      <div className="flex items-center gap-3 pt-2">
        <Checkbox id="technicalStaff" checked={isTechnicalStaff} disabled />
        <label htmlFor="technicalStaff" className="text-sm text-muted-foreground cursor-default">
          {t('staffRoles.technicalStaff')}
        </label>
      </div>

       {selectedRole && (
         <div className="pt-3 space-y-1.5">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">
                  {s('defaultModel', isRu)}
                </label>
              </div>
            </div>
          <p className="text-xs text-muted-foreground">
            {s('defaultModelHint', isRu)}
          </p>
          <ModelSelector
            value={currentDefault || ''}
            onChange={(val) => {
              setDefaultModel(selectedRole, val || null);
              toast.success(s('defaultModelUpdated', isRu));
            }}
            className="w-full"
          />
          {selectedRole && MODEL_CHOICE_RATIONALE[selectedRole] && (
            <div className="flex gap-2 rounded-md border border-hydra-warning/30 bg-hydra-warning/10 px-3 py-2">
              <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-hydra-warning" />
              <p className="text-xs text-hydra-warning leading-relaxed">
                {isRu ? MODEL_CHOICE_RATIONALE[selectedRole].ru : MODEL_CHOICE_RATIONALE[selectedRole].en}
              </p>
            </div>
          )}
        </div>
      )}

      {userId && (
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-0.5">
              <label htmlFor="requiresApproval" className="text-sm font-medium cursor-pointer">
                {t('staffRoles.requiresApproval')}
              </label>
              <p className="text-xs text-muted-foreground">{t('staffRoles.requiresApprovalHint')}</p>
            </div>
          </div>
          <Switch
            id="requiresApproval"
            checked={requiresApproval}
            onCheckedChange={async (checked) => {
              const success = await onSaveRequiresApproval(checked);
              if (success) toast.success(t('common.saved'));
            }}
            disabled={isSaving || isLoading}
          />
        </div>
      )}
    </>
  );
}
