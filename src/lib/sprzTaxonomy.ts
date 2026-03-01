/**
 * SPRZ type taxonomy: categories and subcategories for strategic plans.
 * Stored in strategic_plans.metadata as { sprzType, sprzSubtype }.
 */

export interface SprzSubtype {
  id: string;
  label: { ru: string; en: string };
}

export interface SprzType {
  id: string;
  icon: string;
  label: { ru: string; en: string };
  subtypes: SprzSubtype[];
}

export const SPRZ_TAXONOMY: SprzType[] = [
  {
    id: 'science',
    icon: '🔬',
    label: { ru: 'Наука', en: 'Science' },
    subtypes: [
      { id: 'research', label: { ru: 'Исследование', en: 'Research' } },
      { id: 'hypothesis', label: { ru: 'Проверка гипотезы', en: 'Hypothesis Testing' } },
      { id: 'thesis', label: { ru: 'Дипломная работа', en: 'Thesis' } },
      { id: 'interdisciplinary', label: { ru: 'Междисциплинарное', en: 'Interdisciplinary' } },
      { id: 'textbook', label: { ru: 'Учебник', en: 'Textbook' } },
    ],
  },
  {
    id: 'technology',
    icon: '💻',
    label: { ru: 'Технологии', en: 'Technology' },
    subtypes: [
      { id: 'architecture', label: { ru: 'Архитектура', en: 'Architecture' } },
      { id: 'infrastructure', label: { ru: 'Инфраструктура', en: 'Infrastructure' } },
      { id: 'ml_ai', label: { ru: 'ML / AI', en: 'ML / AI' } },
      { id: 'automation', label: { ru: 'Автоматизация', en: 'Automation' } },
    ],
  },
  {
    id: 'vibe_coding',
    icon: '🎨',
    label: { ru: 'Вайб-кодинг', en: 'Vibe Coding' },
    subtypes: [
      { id: 'mvp', label: { ru: 'MVP', en: 'MVP' } },
      { id: 'prototype', label: { ru: 'Прототип', en: 'Prototype' } },
      { id: 'pet_project', label: { ru: 'Pet-проект', en: 'Pet Project' } },
      { id: 'hackathon', label: { ru: 'Хакатон', en: 'Hackathon' } },
    ],
  },
  {
    id: 'society',
    icon: '🏛',
    label: { ru: 'Социум', en: 'Society' },
    subtypes: [
      { id: 'education', label: { ru: 'Образование', en: 'Education' } },
      { id: 'politics', label: { ru: 'Политика', en: 'Politics' } },
      { id: 'ecology', label: { ru: 'Экология', en: 'Ecology' } },
      { id: 'ngo', label: { ru: 'НКО', en: 'NGO' } },
    ],
  },
  {
    id: 'design',
    icon: '🎯',
    label: { ru: 'Дизайн', en: 'Design' },
    subtypes: [
      { id: 'ux_ui', label: { ru: 'UX/UI', en: 'UX/UI' } },
      { id: 'branding', label: { ru: 'Брендинг', en: 'Branding' } },
      { id: 'product', label: { ru: 'Продуктовый', en: 'Product' } },
      { id: 'industrial', label: { ru: 'Промышленный', en: 'Industrial' } },
    ],
  },
  {
    id: 'business',
    icon: '💼',
    label: { ru: 'Бизнес', en: 'Business' },
    subtypes: [
      { id: 'startup', label: { ru: 'Стартап', en: 'Startup' } },
      { id: 'scaling', label: { ru: 'Масштабирование', en: 'Scaling' } },
      { id: 'optimization', label: { ru: 'Оптимизация', en: 'Optimization' } },
      { id: 'market_entry', label: { ru: 'Выход на рынок', en: 'Market Entry' } },
    ],
  },
  {
    id: 'creativity',
    icon: '✨',
    label: { ru: 'Творчество', en: 'Creativity' },
    subtypes: [
      { id: 'literature', label: { ru: 'Литература', en: 'Literature' } },
      { id: 'music', label: { ru: 'Музыка', en: 'Music' } },
      { id: 'video', label: { ru: 'Видео', en: 'Video' } },
      { id: 'games', label: { ru: 'Игры', en: 'Games' } },
    ],
  },
];

/** Find a type entry by id */
export function getSprzType(typeId: string): SprzType | undefined {
  return SPRZ_TAXONOMY.find(t => t.id === typeId);
}

/** Get subtypes for a given type id */
export function getSprzSubtypes(typeId: string): SprzSubtype[] {
  return getSprzType(typeId)?.subtypes ?? [];
}

/** Format a human-readable label for type + subtype */
export function formatSprzTypeLabel(
  typeId: string | undefined,
  subtypeId: string | undefined,
  lang: string,
): string {
  if (!typeId) return '';
  const type = getSprzType(typeId);
  if (!type) return '';
  const typeLabel = lang === 'ru' ? type.label.ru : type.label.en;
  if (!subtypeId) return `${type.icon} ${typeLabel}`;
  const subtype = type.subtypes.find(s => s.id === subtypeId);
  if (!subtype) return `${type.icon} ${typeLabel}`;
  const subtypeLabel = lang === 'ru' ? subtype.label.ru : subtype.label.en;
  return `${type.icon} ${typeLabel} → ${subtypeLabel}`;
}
