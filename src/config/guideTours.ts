/**
 * Guide Tours — declarative route definitions for the Экскурсовод.
 * Each tour is a sequence of steps with CSS selectors and descriptions.
 */

export interface GuideTourStep {
  /** CSS selector for the target element to highlight */
  selector: string;
  /** Route to navigate to before highlighting (optional if same page) */
  route?: string;
  /** Localized title */
  title: { ru: string; en: string };
  /** Localized description */
  description: { ru: string; en: string };
  /** Optional action to perform on the element (e.g. click to open a menu) */
  action?: 'click' | 'hover';
  /** Tooltip placement relative to the highlighted element */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay in ms before showing this step (for animations to complete) */
  delayMs?: number;
}

export interface GuideTour {
  id: string;
  title: { ru: string; en: string };
  description: { ru: string; en: string };
  /** Icon name from lucide-react */
  icon: string;
  steps: GuideTourStep[];
}

export const GUIDE_TOURS: GuideTour[] = [
  {
    id: 'welcome',
    title: { ru: 'Знакомство с Hydra', en: 'Welcome to Hydra' },
    description: { ru: 'Обзор основных разделов платформы', en: 'Overview of the main platform sections' },
    icon: 'Compass',
    steps: [
      {
        selector: '[data-sidebar="header"]',
        route: '/',
        title: { ru: 'Добро пожаловать!', en: 'Welcome!' },
        description: {
          ru: 'AI-Hydra — платформа для мультиагентных дискуссий с ИИ. Здесь логотип и навигация.',
          en: 'AI-Hydra — a platform for multi-agent AI discussions. Here is the logo and navigation.',
        },
        placement: 'right',
      },
      {
        selector: 'a[href="/tasks"]',
        title: { ru: 'Задачи', en: 'Tasks' },
        description: {
          ru: 'Менеджер задач. Создавайте задачи, прикрепляйте файлы и ведите обсуждения с ИИ-командой.',
          en: 'Task manager. Create tasks, attach files, and discuss with the AI team.',
        },
        placement: 'right',
      },
      {
        selector: 'a[href="/staff-roles"]',
        title: { ru: 'Штат специалистов', en: 'AI Staff' },
        description: {
          ru: '12 ИИ-ролей: от Эксперта до Инструменталиста. Настраивайте промпты, поведение и иерархию.',
          en: '12 AI roles: from Expert to Toolsmith. Configure prompts, behavior, and hierarchy.',
        },
        placement: 'right',
      },
      {
        selector: 'a[href="/expert-panel"]',
        title: { ru: 'Панель экспертов', en: 'Expert Panel' },
        description: {
          ru: 'Главная арена. Здесь ИИ-специалисты обсуждают ваш вопрос коллегиально — Эксперт, Критик, Арбитр.',
          en: 'The main arena. AI specialists discuss your question collegially — Expert, Critic, Arbiter.',
        },
        placement: 'right',
      },
      {
        selector: 'a[href="/model-ratings"]',
        title: { ru: 'Подиум ИИ-моделей', en: 'AI Model Podium' },
        description: {
          ru: 'Досье моделей, конкурсы интеллект-красоты и рейтинги. Выбирайте лучшие «мозги» для каждой роли.',
          en: 'Model dossiers, beauty contests, and ratings. Choose the best "brains" for each role.',
        },
        placement: 'right',
      },
      {
        selector: 'a[href="/hydrapedia"]',
        title: { ru: 'Гидропедия', en: 'Hydrapedia' },
        description: {
          ru: 'Встроенная энциклопедия. Всё о возможностях платформы, ролях и функциях.',
          en: 'Built-in encyclopedia. Everything about platform capabilities, roles, and features.',
        },
        placement: 'right',
      },
    ],
  },
  {
    id: 'expert-panel',
    title: { ru: 'Как работает Панель экспертов', en: 'How the Expert Panel Works' },
    description: { ru: 'Пошаговое руководство по мультиагентному обсуждению', en: 'Step-by-step guide to multi-agent discussion' },
    icon: 'Users',
    steps: [
      {
        selector: '[data-guide="model-selector"]',
        route: '/expert-panel',
        title: { ru: 'Выбор моделей', en: 'Model Selection' },
        description: {
          ru: 'Выберите ИИ-модели для ролей Эксперта, Критика и Арбитра. Каждая роль может использовать свою модель.',
          en: 'Choose AI models for Expert, Critic, and Arbiter roles. Each role can use a different model.',
        },
        placement: 'bottom',
      },
      {
        selector: '[data-guide="chat-input"]',
        title: { ru: 'Ввод запроса', en: 'Input Query' },
        description: {
          ru: 'Введите вопрос или задачу. Поддерживаются вложения файлов и изображений.',
          en: 'Enter your question or task. File and image attachments are supported.',
        },
        placement: 'top',
      },
      {
        selector: '[data-guide="consultant-panel"]',
        title: { ru: 'D-Chat (Консультант)', en: 'D-Chat (Consultant)' },
        description: {
          ru: 'Боковая панель для приватного диалога с отдельным специалистом — Эксперт, Критик или Web-Охотник.',
          en: 'Side panel for private dialogue with a specialist — Expert, Critic, or Web-Hunter.',
        },
        placement: 'left',
      },
    ],
  },
  {
    id: 'staff-roles',
    title: { ru: 'Штат специалистов', en: 'AI Staff' },
    description: { ru: 'Настройка ролей, промптов и поведения ИИ-команды', en: 'Configure roles, prompts, and AI team behavior' },
    icon: 'UserCog',
    steps: [
      {
        selector: '[data-guide="staff-list"]',
        route: '/staff-roles',
        title: { ru: 'Список ролей', en: 'Role List' },
        description: {
          ru: '6 экспертных ролей (Эксперт, Критик, Арбитр, Консультант, Модератор, Советник) и 6 технических (Архивариус, Аналитик и др.).',
          en: '6 expert roles (Expert, Critic, Arbiter, Consultant, Moderator, Advisor) and 6 technical ones (Archivist, Analyst, etc.).',
        },
        placement: 'right',
      },
      {
        selector: '[data-guide="role-details"]',
        title: { ru: 'Детали роли', en: 'Role Details' },
        description: {
          ru: 'Системный промпт, иерархия подчинения и настройки поведения. Всё редактируется inline.',
          en: 'System prompt, hierarchy, and behavior settings. Everything is editable inline.',
        },
        placement: 'left',
      },
    ],
  },
];

/** Get a tour by ID */
export function getTourById(id: string): GuideTour | undefined {
  return GUIDE_TOURS.find(t => t.id === id);
}
