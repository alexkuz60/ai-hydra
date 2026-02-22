import { useLanguage } from '@/contexts/LanguageContext';

const dict: Record<string, { ru: string; en: string }> = {
  // FlowToolbar tooltips
  'undoTooltip': { ru: 'Отменить (Ctrl+Z)', en: 'Undo (Ctrl+Z)' },
  'redoTooltip': { ru: 'Повторить (Ctrl+Shift+Z)', en: 'Redo (Ctrl+Shift+Z)' },

  // FlowLogisticsPanel
  'logistics.you': { ru: 'Вы', en: 'You' },
  'logistics.logistician': { ru: 'Логистик', en: 'Logistician' },
  'logistics.stop': { ru: 'Остановить', en: 'Stop' },

  // FlowSidebar categories
  'category.basic': { ru: 'Базовые', en: 'Basic' },
  'category.data': { ru: 'Данные', en: 'Data' },
  'category.integration': { ru: 'Интеграции', en: 'Integrations' },
  'category.logic': { ru: 'Логика', en: 'Logic' },
  'category.ai': { ru: 'AI', en: 'AI' },
  'category.structure': { ru: 'Структура', en: 'Structure' },
};

export function useFlowI18n() {
  const { language } = useLanguage();
  return (key: string) => dict[key]?.[language === 'ru' ? 'ru' : 'en'] ?? key;
}

export const FLOW_DICT = dict;
