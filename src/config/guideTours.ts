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
  {
    id: 'model-ratings',
    title: { ru: 'Подиум ИИ-моделей', en: 'AI Model Podium' },
    description: { ru: 'Портфолио, конкурсы и рейтинги моделей', en: 'Portfolio, contests, and model ratings' },
    icon: 'Crown',
    steps: [
      {
        selector: '[data-guide="podium-sections"]',
        route: '/model-ratings',
        title: { ru: 'Разделы Подиума', en: 'Podium Sections' },
        description: {
          ru: 'Навигатор разделов: Портфолио, Правила конкурса, Конкурс интеллект-красоты и Рейтинги.',
          en: 'Section navigator: Portfolio, Contest Rules, Intelligence Contest, and Ratings.',
        },
        placement: 'right',
      },
      {
        selector: '[data-guide="podium-content"]',
        title: { ru: 'Рабочая область', en: 'Work Area' },
        description: {
          ru: 'Здесь отображается содержимое выбранного раздела — досье моделей, настройки конкурса или аналитика.',
          en: 'This area shows the selected section content — model dossiers, contest setup, or analytics.',
        },
        placement: 'left',
      },
    ],
  },
  {
    id: 'flow-editor',
    title: { ru: 'Редактор потоков мысли', en: 'Thought Flow Editor' },
    description: { ru: 'Визуальное проектирование логики ИИ', en: 'Visual AI logic design' },
    icon: 'GitBranch',
    steps: [
      {
        selector: '[data-guide="flow-toolbar"]',
        route: '/flow-editor',
        title: { ru: 'Панель инструментов', en: 'Toolbar' },
        description: {
          ru: 'Имя диаграммы, стиль связей, Undo/Redo, авто-раскладка и запуск потока.',
          en: 'Diagram name, edge styles, Undo/Redo, auto-layout, and flow execution.',
        },
        placement: 'bottom',
      },
      {
        selector: '[data-guide="flow-sidebar"]',
        title: { ru: 'Палитра узлов', en: 'Node Palette' },
        description: {
          ru: 'Перетаскивайте узлы на холст: Input, Prompt, Model, Condition, Output и многие другие.',
          en: 'Drag nodes onto the canvas: Input, Prompt, Model, Condition, Output, and more.',
        },
        placement: 'right',
      },
      {
        selector: '[data-guide="flow-canvas"]',
        title: { ru: 'Холст диаграммы', en: 'Diagram Canvas' },
        description: {
          ru: 'Основная рабочая область. Соединяйте узлы, настраивайте свойства и стройте потоки мысли.',
          en: 'Main workspace. Connect nodes, configure properties, and build thought flows.',
        },
        placement: 'left',
      },
    ],
  },
  {
    id: 'role-library',
    title: { ru: 'Библиотека промптов', en: 'Prompt Library' },
    description: { ru: 'Управление системными промптами для ролей', en: 'Managing system prompts for roles' },
    icon: 'Library',
    steps: [
      {
        selector: '[data-guide="prompt-list"]',
        route: '/role-library',
        title: { ru: 'Список промптов', en: 'Prompt List' },
        description: {
          ru: 'Все промпты сгруппированы по языку. Фильтруйте по роли, владельцу или поисковому запросу.',
          en: 'All prompts grouped by language. Filter by role, owner, or search query.',
        },
        placement: 'right',
      },
      {
        selector: '[data-guide="prompt-details"]',
        title: { ru: 'Детали промпта', en: 'Prompt Details' },
        description: {
          ru: 'Просмотр и редактирование содержимого, метаданных и настроек выбранного промпта.',
          en: 'View and edit the content, metadata, and settings of the selected prompt.',
        },
        placement: 'left',
      },
    ],
  },
  {
    id: 'tools-library',
    title: { ru: 'Инструменты ИИ', en: 'AI Tools' },
    description: { ru: 'Библиотека Prompt- и HTTP-инструментов', en: 'Prompt & HTTP tools library' },
    icon: 'Wrench',
    steps: [
      {
        selector: '[data-guide="tools-list"]',
        route: '/tools-library',
        title: { ru: 'Каталог инструментов', en: 'Tools Catalog' },
        description: {
          ru: 'Список всех инструментов по категориям: AI, Data, Integration. Системные защищены от редактирования.',
          en: 'All tools by category: AI, Data, Integration. System tools are read-only.',
        },
        placement: 'right',
      },
      {
        selector: '[data-guide="tools-details"]',
        title: { ru: 'Детали инструмента', en: 'Tool Details' },
        description: {
          ru: 'Просмотр параметров, статистика использования и встроенный тестер (Prompt или HTTP).',
          en: 'View parameters, usage stats, and built-in tester (Prompt or HTTP).',
        },
        placement: 'left',
      },
    ],
  },
  {
    id: 'behavioral-patterns',
    title: { ru: 'Паттерны поведения', en: 'Behavioral Patterns' },
    description: { ru: 'Стратегические рецепты и ролевые паттерны', en: 'Strategic blueprints & role behaviors' },
    icon: 'Target',
    steps: [
      {
        selector: '[data-guide="patterns-list"]',
        route: '/behavioral-patterns',
        title: { ru: 'Список паттернов', en: 'Pattern List' },
        description: {
          ru: 'Два типа: стратегические рецепты (Blueprints) с этапами и контрольными точками, и ролевые паттерны (Behaviors) с настройками коммуникации.',
          en: 'Two types: strategic blueprints with stages and checkpoints, and role behaviors with communication settings.',
        },
        placement: 'right',
      },
      {
        selector: '[data-guide="patterns-details"]',
        title: { ru: 'Детали паттерна', en: 'Pattern Details' },
        description: {
          ru: 'Inline-редактирование параметров, бейджи реакций и интеграция с Редактором потоков.',
          en: 'Inline editing, reaction badges, and Flow Editor integration.',
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
