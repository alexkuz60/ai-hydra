import { LucideIcon, UserCircle, GraduationCap, ListChecks, FileText, Users, AlertTriangle, Crown, Bookmark } from 'lucide-react';

export interface PromptSection {
  key: string;
  title: string;
  content: string;
  icon: LucideIcon;
  isCustom: boolean;
}

export interface ParsedPrompt {
  title: string;
  sections: PromptSection[];
}

// Standard sections with their localized titles and icons
interface StandardSectionConfig {
  key: string;
  patterns: RegExp[];
  icon: LucideIcon;
}

const STANDARD_SECTIONS: StandardSectionConfig[] = [
  {
    key: 'identity',
    patterns: [/^идентичность$/i, /^identity$/i],
    icon: UserCircle,
  },
  {
    key: 'competencies',
    patterns: [/^компетенции$/i, /^competencies$/i, /^навыки$/i, /^skills$/i],
    icon: GraduationCap,
  },
  {
    key: 'methodology',
    patterns: [
      /^методология/i,
      /^methodology$/i,
      /^типичные задачи$/i,
      /^typical tasks$/i,
      /^подход к работе$/i,
      /^approach$/i,
    ],
    icon: ListChecks,
  },
  {
    key: 'format',
    patterns: [/^формат/i, /^format/i, /^стиль ответ/i, /^response style/i],
    icon: FileText,
  },
  {
    key: 'teamwork',
    patterns: [
      /^взаимодействие/i,
      /^teamwork$/i,
      /^collaboration$/i,
      /^командная работа$/i,
      /^работа с командой$/i,
    ],
    icon: Users,
  },
  {
    key: 'limitations',
    patterns: [/^ограничения$/i, /^limitations$/i, /^constraints$/i, /^границы$/i],
    icon: AlertTriangle,
  },
  {
    key: 'supervisor',
    patterns: [
      /^пожелания супервизора$/i,
      /^supervisor/i,
      /^инструкции руководител/i,
      /^management/i,
    ],
    icon: Crown,
  },
];

/**
 * Matches a section title against known standard sections
 */
function matchStandardSection(title: string): StandardSectionConfig | null {
  for (const section of STANDARD_SECTIONS) {
    for (const pattern of section.patterns) {
      if (pattern.test(title.trim())) {
        return section;
      }
    }
  }
  return null;
}

/**
 * Parses a system prompt into structured sections
 */
export function parsePromptSections(prompt: string): ParsedPrompt {
  if (!prompt || !prompt.trim()) {
    return {
      title: '',
      sections: [],
    };
  }

  const lines = prompt.split('\n');
  let title = '';
  const sections: PromptSection[] = [];
  let currentSection: PromptSection | null = null;
  let contentLines: string[] = [];
  let customIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Match main title (# Title)
    const titleMatch = line.match(/^#\s+(.+)$/);
    if (titleMatch && !title) {
      title = titleMatch[1].trim();
      continue;
    }
    
    // Match section header (## Section)
    const sectionMatch = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      // Save previous section if exists
      if (currentSection) {
        currentSection.content = contentLines.join('\n').trim();
        sections.push(currentSection);
      }
      
      const sectionTitle = sectionMatch[1].trim();
      const standardSection = matchStandardSection(sectionTitle);
      
      if (standardSection) {
        currentSection = {
          key: standardSection.key,
          title: sectionTitle,
          content: '',
          icon: standardSection.icon,
          isCustom: false,
        };
      } else {
        currentSection = {
          key: `custom_${customIndex++}`,
          title: sectionTitle,
          content: '',
          icon: Bookmark,
          isCustom: true,
        };
      }
      
      contentLines = [];
      continue;
    }
    
    // Accumulate content lines
    if (currentSection) {
      contentLines.push(line);
    }
  }
  
  // Don't forget the last section
  if (currentSection) {
    currentSection.content = contentLines.join('\n').trim();
    sections.push(currentSection);
  }
  
  return { title, sections };
}

/**
 * Assembles sections back into a single prompt string
 */
export function sectionsToPrompt(title: string, sections: PromptSection[]): string {
  const parts: string[] = [];
  
  if (title.trim()) {
    parts.push(`# ${title.trim()}`);
    parts.push('');
  }
  
  for (const section of sections) {
    if (section.content.trim() || section.key === 'identity') {
      parts.push(`## ${section.title}`);
      parts.push(section.content.trim());
      parts.push('');
    }
  }
  
  return parts.join('\n').trim();
}

/**
 * Gets the icon for a standard section key
 */
export function getSectionIcon(key: string): LucideIcon {
  const standard = STANDARD_SECTIONS.find(s => s.key === key);
  return standard?.icon || Bookmark;
}

/**
 * Creates an empty section with the given title
 */
export function createEmptySection(title: string): PromptSection {
  const standardSection = matchStandardSection(title);
  
  if (standardSection) {
    return {
      key: standardSection.key,
      title,
      content: '',
      icon: standardSection.icon,
      isCustom: false,
    };
  }
  
  return {
    key: `custom_${Date.now()}`,
    title,
    content: '',
    icon: Bookmark,
    isCustom: true,
  };
}

/**
 * Section writing tips for contextual help
 */
export const SECTION_TIPS: Record<string, { title: string; tips: string[] }> = {
  identity: {
    title: 'Идентичность',
    tips: [
      'Чётко определи роль и место в системе Hydra',
      'Укажи основную миссию специалиста',
      'Опиши уникальную ценность для команды',
    ],
  },
  competencies: {
    title: 'Компетенции',
    tips: [
      'Используй списки для перечисления навыков',
      'Начинай пункты с глаголов действия',
      'Ограничь список 5-7 ключевыми навыками',
      'Избегай расплывчатых формулировок',
    ],
  },
  methodology: {
    title: 'Методология',
    tips: [
      'Опиши пошаговый алгоритм работы',
      'Укажи критерии принятия решений',
      'Включи типичные сценарии использования',
    ],
  },
  format: {
    title: 'Формат ответов',
    tips: [
      'Определи предпочтительную структуру ответа',
      'Укажи ограничения по объёму',
      'Опиши стиль коммуникации',
    ],
  },
  teamwork: {
    title: 'Взаимодействие',
    tips: [
      'Опиши взаимодействие с другими ролями',
      'Укажи триггеры для делегирования задач',
      'Определи границы ответственности',
    ],
  },
  limitations: {
    title: 'Ограничения',
    tips: [
      'Чётко обозначь, что НЕ входит в компетенции',
      'Укажи ситуации для эскалации',
      'Опиши красные флаги',
    ],
  },
  supervisor: {
    title: 'Пожелания Супервизора',
    tips: [
      'Укажи особые инструкции от руководителя',
      'Опиши приоритеты для этой роли',
      'Добавь контекстные ограничения',
    ],
  },
  custom: {
    title: 'Пользовательская секция',
    tips: [
      'Дай секции понятное название',
      'Структурируй контент списками',
      'Избегай дублирования с другими секциями',
    ],
  },
};
