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
  // ─── 0. Tasks Tour ───
  {
    id: 'tasks',
    title: { ru: 'Менеджер задач', en: 'Task Manager' },
    description: { ru: 'Создание задач, файлы и настройка ИИ-команды', en: 'Task creation, files, and AI team setup' },
    icon: 'CheckSquare',
    steps: [
      {
        selector: '[data-guide="tasks-list"]',
        route: '/tasks',
        title: { ru: 'Список задач', en: 'Task List' },
        description: {
          ru: 'Все ваши задачи. Каждая задача — отдельная сессия обсуждения с ИИ-командой.',
          en: 'All your tasks. Each task is a separate discussion session with the AI team.',
        },
        placement: 'right',
      },
      {
        selector: '[data-guide="tasks-create-form"]',
        title: { ru: 'Создание задачи', en: 'Create Task' },
        description: {
          ru: 'Введите название задачи, выберите ИИ-модели для команды и нажмите «+» для создания.',
          en: 'Enter a task name, choose AI models for the team, and press "+" to create.',
        },
        placement: 'right',
      },
      {
        selector: '[data-guide="tasks-list"]',
        title: { ru: 'Выберите задачу', en: 'Select a Task' },
        description: {
          ru: 'Кликните на любую задачу в списке, чтобы открыть панель деталей справа.',
          en: 'Click any task in the list to open the details panel on the right.',
        },
        placement: 'right',
      },
      {
        selector: '[data-guide="tasks-details"]',
        title: { ru: 'Детали задачи', en: 'Task Details' },
        description: {
          ru: 'Настройки выбранной задачи: название, описание, модели и параметры каждой роли.',
          en: 'Selected task settings: title, description, models, and per-role parameters.',
        },
        placement: 'left',
      },
      {
        selector: '[data-guide="tasks-files-tab"]',
        title: { ru: 'Файлы задачи', en: 'Task Files' },
        description: {
          ru: 'Прикрепляйте документы и файлы к задаче. Модели могут учитывать их содержимое при обсуждении.',
          en: 'Attach documents and files to the task. Models can consider their content during discussion.',
        },
        placement: 'left',
      },
      {
        selector: '[data-guide="tasks-open-btn"]',
        title: { ru: 'Открыть обсуждение', en: 'Open Discussion' },
        description: {
          ru: 'Перейдите к Панели экспертов для коллегиального обсуждения задачи с ИИ-командой.',
          en: 'Go to the Expert Panel for collegial discussion of the task with the AI team.',
        },
        placement: 'bottom',
      },
    ],
  },

  // ─── 1. Welcome Tour ───
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

  // ─── 2. Expert Panel Tour ───
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
        selector: '[data-guide="chat-tree-nav"]',
        title: { ru: 'Навигатор участников', en: 'Participant Navigator' },
        description: {
          ru: 'Дерево сообщений и участников обсуждения. Кликайте для перехода к сообщению, дважды — для фильтрации по участнику.',
          en: 'Message and participant tree. Click to jump to a message, double-click to filter by participant.',
        },
        placement: 'right',
      },
      {
        selector: '[data-guide="chat-messages"]',
        title: { ru: 'Область обсуждения', en: 'Discussion Area' },
        description: {
          ru: 'Здесь отображаются сообщения всех участников. Оценивайте ответы, сохраняйте в память, запрашивайте уточнения.',
          en: 'All participant messages appear here. Rate responses, save to memory, request clarifications.',
        },
        placement: 'top',
      },
      {
        selector: '[data-guide="chat-input"]',
        title: { ru: 'Ввод запроса', en: 'Input Query' },
        description: {
          ru: 'Введите вопрос или задачу. Поддерживаются вложения файлов и изображений, таймаут и пожелания Супервайзера.',
          en: 'Enter your question or task. File/image attachments, timeout, and Supervisor wishes are supported.',
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

  // ─── 3. Staff Roles Tour ───
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
          ru: '6 экспертных ролей (Эксперт, Критик, Арбитр, Консультант, Модератор, Советник) и 6 технических.',
          en: '6 expert roles (Expert, Critic, Arbiter, Consultant, Moderator, Advisor) and 6 technical ones.',
        },
        placement: 'right',
      },
      {
        selector: '[data-guide="staff-seed-button"]',
        title: { ru: 'Обучение техников', en: 'Seed Tech Roles' },
        description: {
          ru: 'Одной кнопкой загрузите базу знаний для всех технических ролей — Архивариус, Аналитик и др.',
          en: 'One click to seed knowledge base for all technical roles — Archivist, Analyst, etc.',
        },
        placement: 'bottom',
      },
      {
        selector: '[data-guide="staff-list"]',
        title: { ru: 'Выберите роль', en: 'Select a Role' },
        description: {
          ru: 'Кликните на любую роль в списке, чтобы открыть панель настроек справа.',
          en: 'Click any role in the list to open the settings panel on the right.',
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
      {
        selector: '[data-guide="staff-experts-group"]',
        title: { ru: 'Группа экспертов', en: 'Expert Group' },
        description: {
          ru: 'Эксперт, Критик, Арбитр, Консультант, Модератор и Советник — роли для дискуссий и принятия решений.',
          en: 'Expert, Critic, Arbiter, Consultant, Moderator, Advisor — roles for discussions and decisions.',
        },
        placement: 'right',
      },
      {
        selector: '[data-guide="staff-technical-group"]',
        title: { ru: 'Технический персонал', en: 'Technical Staff' },
        description: {
          ru: 'Архивариус, Аналитик, Промпт-инженер, Регулятор, Инструменталист и Web-Охотник — скрытая инфраструктура.',
          en: 'Archivist, Analyst, Prompt Engineer, Regulator, Toolsmith, Web-Hunter — hidden infrastructure.',
        },
        placement: 'right',
      },
    ],
  },

  // ─── 4. Model Ratings Tour ───
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
      {
        selector: '[data-guide="podium-portfolio-btn"]',
        title: { ru: 'Портфолио моделей', en: 'Model Portfolio' },
        description: {
          ru: 'Каталог всех доступных ИИ-моделей с провайдерами, ценами и характеристиками.',
          en: 'Catalog of all available AI models with providers, pricing, and specs.',
        },
        placement: 'right',
      },
      {
        selector: '[data-guide="podium-ratings-btn"]',
        title: { ru: 'Рейтинги', en: 'Ratings' },
        description: {
          ru: 'Статистика использования моделей, оценки Арбитра и итоговые рейтинги по проекту.',
          en: 'Model usage statistics, Arbiter evaluations, and project-wide ratings.',
        },
        placement: 'right',
      },
      {
        selector: '[data-guide="podium-contest-btn"]',
        title: { ru: 'Конкурс интеллект-красоты', en: 'Intelligence Contest' },
        description: {
          ru: 'Соревнования между моделями: арена реального времени, жюри и турнирные сетки.',
          en: 'Model competitions: real-time arena, judging panel, and tournament brackets.',
        },
        placement: 'right',
      },
    ],
  },

  // ─── 5. Flow Editor Tour ───
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
      {
        selector: '[data-guide="flow-header-actions"]',
        title: { ru: 'Управление диаграммами', en: 'Diagram Management' },
        description: {
          ru: 'Сохранение, загрузка, экспорт в PNG/SVG/JSON/YAML, создание новой диаграммы и генерация Mermaid-кода.',
          en: 'Save, load, export to PNG/SVG/JSON/YAML, create new diagram, and generate Mermaid code.',
        },
        placement: 'bottom',
      },
      {
        selector: '[data-guide="flow-execute-btn"]',
        title: { ru: 'Запуск потока', en: 'Run Flow' },
        description: {
          ru: 'Запускает выполнение диаграммы — данные проходят через все узлы от Input до Output.',
          en: 'Executes the diagram — data flows through all nodes from Input to Output.',
        },
        placement: 'bottom',
      },
    ],
  },

  // ─── 6. Prompt Library Tour ───
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
        selector: '[data-guide="prompt-filters"]',
        title: { ru: 'Фильтры', en: 'Filters' },
        description: {
          ru: 'Поиск по тексту, фильтр по роли и типу владельца (свои, общие, системные).',
          en: 'Text search, role filter, and owner type filter (own, shared, system).',
        },
        placement: 'right',
      },
      {
        selector: '[data-guide="prompt-create-btn"]',
        title: { ru: 'Создание промпта', en: 'Create Prompt' },
        description: {
          ru: 'Создайте новый промпт: выберите роль, язык, напишите содержимое и сохраните в библиотеку.',
          en: 'Create a new prompt: choose a role, language, write content, and save to the library.',
        },
        placement: 'bottom',
      },
      {
        selector: '[data-guide="prompt-list"]',
        title: { ru: 'Выберите промпт', en: 'Select a Prompt' },
        description: {
          ru: 'Кликните на любой промпт в списке, чтобы открыть панель деталей справа.',
          en: 'Click any prompt in the list to open the details panel on the right.',
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

  // ─── 7. Tools Library Tour ───
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
        selector: '[data-guide="tools-filters"]',
        title: { ru: 'Фильтры', en: 'Filters' },
        description: {
          ru: 'Поиск по имени и описанию, фильтр по типу владельца (системные, свои, общие).',
          en: 'Search by name/description, filter by owner type (system, own, shared).',
        },
        placement: 'right',
      },
      {
        selector: '[data-guide="tools-create-btn"]',
        title: { ru: 'Создание инструмента', en: 'Create Tool' },
        description: {
          ru: 'Создайте Prompt-tool или HTTP API-tool с параметрами, шаблоном и настройками.',
          en: 'Create a Prompt tool or HTTP API tool with parameters, template, and settings.',
        },
        placement: 'bottom',
      },
      {
        selector: '[data-guide="tools-import-btn"]',
        title: { ru: 'Импорт инструмента', en: 'Import Tool' },
        description: {
          ru: 'Импортируйте готовый инструмент из JSON-файла — быстрый обмен с коллегами.',
          en: 'Import a ready-made tool from a JSON file — quick sharing with colleagues.',
        },
        placement: 'bottom',
      },
      {
        selector: '[data-guide="tools-list"]',
        title: { ru: 'Выберите инструмент', en: 'Select a Tool' },
        description: {
          ru: 'Кликните на любой инструмент в списке, чтобы открыть панель деталей справа.',
          en: 'Click any tool in the list to open the details panel on the right.',
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

  // ─── 8. Behavioral Patterns Tour ───
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
          ru: 'Два типа: стратегические рецепты (Blueprints) с этапами и контрольными точками, и ролевые паттерны (Behaviors).',
          en: 'Two types: strategic blueprints with stages/checkpoints, and role behaviors.',
        },
        placement: 'right',
      },
      {
        selector: '[data-guide="patterns-strategic-group"]',
        title: { ru: 'Стратегические рецепты', en: 'Strategic Blueprints' },
        description: {
          ru: 'Многоэтапные сценарии с назначением ролей на каждый этап и контрольными точками.',
          en: 'Multi-stage scenarios with role assignments per stage and checkpoints.',
        },
        placement: 'right',
      },
      {
        selector: '[data-guide="patterns-behavior-group"]',
        title: { ru: 'Ролевые паттерны', en: 'Role Behaviors' },
        description: {
          ru: 'Настройки коммуникации для каждой роли: тон, детализация, реакции и взаимодействия.',
          en: 'Communication settings per role: tone, verbosity, reactions, and interactions.',
        },
        placement: 'right',
      },
      {
        selector: '[data-guide="patterns-list"]',
        title: { ru: 'Выберите паттерн', en: 'Select a Pattern' },
        description: {
          ru: 'Кликните на любой паттерн в списке, чтобы открыть панель деталей справа.',
          en: 'Click any pattern in the list to open the details panel on the right.',
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
      {
        selector: '[data-guide="patterns-create-blueprint"]',
        title: { ru: 'Создание рецепта', en: 'Create Blueprint' },
        description: {
          ru: 'Создайте новый стратегический рецепт с этапами, ролями и контрольными точками.',
          en: 'Create a new strategic blueprint with stages, roles, and checkpoints.',
        },
        placement: 'right',
      },
    ],
  },
];

/** Get a tour by ID */
export function getTourById(id: string): GuideTour | undefined {
  return GUIDE_TOURS.find(t => t.id === id);
}
