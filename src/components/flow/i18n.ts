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

  // EdgeStyleSelector
  'edge.style': { ru: 'Стиль связей', en: 'Edge Style' },
  'edge.lineType': { ru: 'Тип линии', en: 'Line Type' },
  'edge.arrowType': { ru: 'Тип стрелки', en: 'Arrow Type' },
  'edge.flowAnimation': { ru: 'Анимация потока', en: 'Flow Animation' },
  'edge.directionStyles': { ru: 'Стили направления', en: 'Direction Styles' },

  // EdgePropertiesPanel
  'edge.properties': { ru: 'Свойства связи', en: 'Edge Properties' },
  'edge.source': { ru: 'Источник', en: 'Source' },
  'edge.target': { ru: 'Цель', en: 'Target' },
  'edge.label': { ru: 'Подпись', en: 'Label' },
  'edge.labelPlaceholder': { ru: 'Добавить подпись...', en: 'Add label...' },
  'edge.dataType': { ru: 'Тип данных', en: 'Data Type' },
  'edge.strokeWidth': { ru: 'Толщина', en: 'Stroke Width' },
  'edge.animation': { ru: 'Анимация', en: 'Animation' },
  'edge.delete': { ru: 'Удалить связь', en: 'Delete Edge' },
};

export function useFlowI18n() {
  const { language } = useLanguage();
  return (key: string) => dict[key]?.[language === 'ru' ? 'ru' : 'en'] ?? key;
}

export const FLOW_DICT = dict;
