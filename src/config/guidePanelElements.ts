/**
 * Panel UI elements for each guide tour step.
 * Maps tour step index to a list of interactive elements visible on that panel,
 * so the user can pick one and get a detailed explanation.
 */

export interface PanelElement {
  id: string;
  label: { ru: string; en: string };
  description: { ru: string; en: string };
  /** Optional CSS selector to highlight the explained element on the page */
  selector?: string;
}

export interface TourStepElements {
  /** tourId from guideTours */
  tourId: string;
  /** stepIndex → array of panel elements */
  steps: Record<number, PanelElement[]>;
}

const TOUR_PANEL_ELEMENTS: TourStepElements[] = [
  // ─── Tasks Tour ───
  {
    tourId: 'tasks',
    steps: {
      0: [
        { id: 'search', label: { ru: 'Поиск задач', en: 'Task Search' }, description: { ru: 'Поле для поиска задач по названию и описанию. Фильтрация происходит в реальном времени.', en: 'Search tasks by title and description. Filtering is real-time.' }, selector: '[data-guide="tasks-create-form"] .relative input' },
        { id: 'task-rows', label: { ru: 'Строки задач', en: 'Task Rows' }, description: { ru: 'Каждая строка показывает задачу с названием, моделями и датой. Клик открывает детали справа.', en: 'Each row shows a task with title, models and date. Click opens details on the right.' }, selector: '[data-guide="tasks-list"]' },
        { id: 'active-indicator', label: { ru: 'Индикатор активности', en: 'Active Indicator' }, description: { ru: 'Зелёная точка отмечает текущую активную задачу, связанную с Панелью экспертов.', en: 'Green dot marks the currently active task linked to the Expert Panel.' } },
      ],
      1: [
        { id: 'title-input', label: { ru: 'Поле названия', en: 'Title Input' }, description: { ru: 'Введите краткое название задачи. Оно станет заголовком сессии обсуждения.', en: 'Enter a short task title. It becomes the discussion session heading.' }, selector: '[data-guide="tasks-create-form"] input[placeholder]' },
        { id: 'model-chips', label: { ru: 'Выбор моделей', en: 'Model Selection' }, description: { ru: 'Мульти-селектор ИИ-моделей для формирования команды. Каждая модель получит свою роль.', en: 'Multi-selector for AI models to form the team. Each model gets its own role.' }, selector: '[data-guide="tasks-create-form"]' },
        { id: 'create-btn', label: { ru: 'Кнопка создания (+)', en: 'Create Button (+)' }, description: { ru: 'Создаёт новую задачу с указанными параметрами и добавляет её в список.', en: 'Creates a new task with specified parameters and adds it to the list.' }, selector: '[data-guide="tasks-create-form"] button[type="submit"], [data-guide="tasks-create-form"] button:last-child' },
      ],
      2: [
        { id: 'task-click', label: { ru: 'Клик по задаче', en: 'Task Click' }, description: { ru: 'Клик по строке задачи выделяет её и открывает панель деталей в правой части экрана.', en: 'Clicking a task row selects it and opens the details panel on the right side.' }, selector: '[data-guide="tasks-list"]' },
      ],
      3: [
        { id: 'title-edit', label: { ru: 'Редактор названия', en: 'Title Editor' }, description: { ru: 'Inline-редактирование названия задачи. Изменения сохраняются автоматически при потере фокуса.', en: 'Inline title editing. Changes are saved automatically on blur.' }, selector: '[data-guide="tasks-details"]' },
        { id: 'description-edit', label: { ru: 'Описание задачи', en: 'Task Description' }, description: { ru: 'Текстовое поле для подробного описания задачи. Модели используют его как контекст.', en: 'Text field for detailed task description. Models use it as context.' }, selector: '[data-guide="tasks-details"]' },
        { id: 'model-settings', label: { ru: 'Настройки моделей', en: 'Model Settings' }, description: { ru: 'Параметры каждой модели: температура, max tokens, системный промпт и стоимость.', en: 'Per-model parameters: temperature, max tokens, system prompt, and cost.' }, selector: '[data-guide="tasks-details"]' },
        { id: 'hybrid-toggle', label: { ru: 'Гибридный стриминг', en: 'Hybrid Streaming' }, description: { ru: 'Переключатель режима стриминга: параллельный или последовательный запуск моделей.', en: 'Streaming mode toggle: parallel or sequential model execution.' }, selector: '[data-guide="tasks-details"]' },
        { id: 'delete-btn', label: { ru: 'Удаление задачи', en: 'Delete Task' }, description: { ru: 'Удаляет задачу и все связанные сообщения. Требует подтверждения.', en: 'Deletes the task and all related messages. Requires confirmation.' }, selector: '[data-guide="tasks-details"]' },
      ],
      4: [
        { id: 'upload-btn', label: { ru: 'Кнопка загрузки', en: 'Upload Button' }, description: { ru: 'Открывает диалог выбора файлов для прикрепления к задаче (PDF, изображения, текст).', en: 'Opens file picker to attach files to the task (PDF, images, text).' }, selector: '[data-guide="tasks-files-tab"]' },
        { id: 'file-list', label: { ru: 'Список файлов', en: 'File List' }, description: { ru: 'Прикреплённые файлы с именем, размером и кнопкой удаления.', en: 'Attached files with name, size, and delete button.' }, selector: '[data-guide="tasks-files-tab"]' },
      ],
      5: [
        { id: 'open-btn', label: { ru: 'Кнопка «Открыть»', en: 'Open Button' }, description: { ru: 'Переходит к Панели экспертов с автоматической привязкой текущей задачи как контекста обсуждения.', en: 'Navigates to the Expert Panel with the current task auto-linked as discussion context.' }, selector: '[data-guide="tasks-open-btn"]' },
      ],
    },
  },

  // ─── Welcome Tour ───
  {
    tourId: 'welcome',
    steps: {
      0: [
        { id: 'logo', label: { ru: 'Логотип', en: 'Logo' }, description: { ru: 'Логотип AI-Hydra. Клик возвращает на главную страницу.', en: 'AI-Hydra logo. Click returns to the main page.' } },
        { id: 'theme-toggle', label: { ru: 'Тема оформления', en: 'Theme Toggle' }, description: { ru: 'Переключение между светлой и тёмной темой интерфейса.', en: 'Switch between light and dark interface themes.' } },
        { id: 'lang-toggle', label: { ru: 'Язык интерфейса', en: 'Language Toggle' }, description: { ru: 'Переключение языка интерфейса: Русский / English.', en: 'Switch interface language: Russian / English.' } },
      ],
      1: [
        { id: 'nav-link', label: { ru: 'Ссылка навигации', en: 'Nav Link' }, description: { ru: 'Элемент боковой навигации. Показывает иконку, название раздела и количество элементов.', en: 'Sidebar navigation item. Shows icon, section name, and item count.' } },
      ],
      2: [
        { id: 'nav-link', label: { ru: 'Ссылка навигации', en: 'Nav Link' }, description: { ru: 'Переход к Штату специалистов — настройка промптов и поведения 12 ИИ-ролей.', en: 'Go to AI Staff — configure prompts and behavior for 12 AI roles.' } },
      ],
      3: [
        { id: 'nav-link', label: { ru: 'Ссылка навигации', en: 'Nav Link' }, description: { ru: 'Переход к Панели экспертов — основная арена мультиагентного обсуждения.', en: 'Go to Expert Panel — the main multi-agent discussion arena.' } },
      ],
      4: [
        { id: 'nav-link', label: { ru: 'Ссылка навигации', en: 'Nav Link' }, description: { ru: 'Переход к Гидропедии — встроенная энциклопедия платформы.', en: 'Go to Hydrapedia — built-in platform encyclopedia.' } },
      ],
    },
  },

  // ─── Expert Panel Tour ───
  {
    tourId: 'expert-panel',
    steps: {
      0: [
        { id: 'expert-model', label: { ru: 'Модель Эксперта', en: 'Expert Model' }, description: { ru: 'Селектор ИИ-модели для роли Эксперта. Эксперт формулирует основной ответ.', en: 'AI model selector for Expert role. Expert formulates the main answer.' }, selector: '[data-guide="model-selector"]' },
        { id: 'critic-model', label: { ru: 'Модель Критика', en: 'Critic Model' }, description: { ru: 'Селектор ИИ-модели для роли Критика. Критик анализирует ответ на ошибки и слабые места.', en: 'AI model selector for Critic role. Critic analyzes the answer for errors and weaknesses.' }, selector: '[data-guide="model-selector"]' },
        { id: 'arbiter-model', label: { ru: 'Модель Арбитра', en: 'Arbiter Model' }, description: { ru: 'Селектор ИИ-модели для роли Арбитра. Арбитр выносит итоговую оценку.', en: 'AI model selector for Arbiter role. Arbiter delivers the final evaluation.' }, selector: '[data-guide="model-selector"]' },
        { id: 'session-select', label: { ru: 'Выбор сессии', en: 'Session Select' }, description: { ru: 'Переключение между задачами/сессиями обсуждения. Каждая задача — отдельная сессия.', en: 'Switch between tasks/discussion sessions. Each task is a separate session.' }, selector: '[data-guide="model-selector"]' },
      ],
      1: [
        { id: 'tree-nodes', label: { ru: 'Узлы дерева', en: 'Tree Nodes' }, description: { ru: 'Каждый узел — сообщение участника. Цвет соответствует роли (зелёный — Эксперт, красный — Критик и т.д.).', en: 'Each node is a participant message. Color matches the role (green — Expert, red — Critic, etc.).' }, selector: '[data-guide="chat-tree-nav"]' },
        { id: 'filter-chips', label: { ru: 'Фильтры участников', en: 'Participant Filters' }, description: { ru: 'Клик по имени участника фильтрует дерево, показывая только его сообщения.', en: 'Click a participant name to filter the tree, showing only their messages.' }, selector: '[data-guide="chat-tree-nav"]' },
        { id: 'collapse-btn', label: { ru: 'Свернуть навигатор', en: 'Collapse Navigator' }, description: { ru: 'Сворачивает/разворачивает панель навигатора для экономии экранного пространства.', en: 'Collapses/expands the navigator panel to save screen space.' }, selector: '[data-guide="chat-tree-nav"]' },
      ],
      2: [
        { id: 'message-card', label: { ru: 'Карточка сообщения', en: 'Message Card' }, description: { ru: 'Сообщение участника с аватаром роли, именем модели, текстом и действиями.', en: 'Participant message with role avatar, model name, text, and actions.' }, selector: '[data-guide="chat-messages"]' },
        { id: 'brain-btn', label: { ru: 'Кнопка 🧠', en: '🧠 Button' }, description: { ru: 'Вызывает Модератора для анализа сообщения. Модератор проверяет качество аргументации.', en: 'Calls the Moderator to analyze the message. Moderator checks argumentation quality.' }, selector: '[data-guide="chat-messages"]' },
        { id: 'memory-btn', label: { ru: 'Кнопка 📦', en: '📦 Button' }, description: { ru: 'Сохраняет сообщение в ролевую память для использования в будущих дискуссиях.', en: 'Saves the message to role memory for use in future discussions.' }, selector: '[data-guide="chat-messages"]' },
        { id: 'arbiter-btn', label: { ru: 'Кнопка ⚖️', en: '⚖️ Button' }, description: { ru: 'Запрашивает оценку Арбитра для этого ответа. Ставит баллы за качество.', en: 'Requests Arbiter evaluation for this answer. Scores quality.' }, selector: '[data-guide="chat-messages"]' },
        { id: 'date-separator', label: { ru: 'Разделитель дат', en: 'Date Separator' }, description: { ru: 'Горизонтальный разделитель, группирующий сообщения по дням.', en: 'Horizontal separator grouping messages by day.' }, selector: '[data-guide="chat-messages"]' },
      ],
      3: [
        { id: 'textarea', label: { ru: 'Поле ввода', en: 'Text Input' }, description: { ru: 'Основное текстовое поле для ввода запроса. Поддерживает Markdown и многострочный ввод.', en: 'Main text field for entering queries. Supports Markdown and multiline input.' }, selector: '[data-guide="chat-input"]' },
        { id: 'attach-btn', label: { ru: 'Вложения', en: 'Attachments' }, description: { ru: 'Кнопка для прикрепления файлов и изображений к сообщению.', en: 'Button for attaching files and images to the message.' }, selector: '[data-guide="chat-input"]' },
        { id: 'send-btn', label: { ru: 'Отправка', en: 'Send' }, description: { ru: 'Отправляет запрос на обработку ИИ-командой. Начинается поток ответов.', en: 'Sends the query for AI team processing. Response stream begins.' }, selector: '[data-guide="chat-input"]' },
        { id: 'timeout-slider', label: { ru: 'Таймаут', en: 'Timeout' }, description: { ru: 'Настройка максимального времени ожидания ответа от каждой модели.', en: 'Set the maximum wait time for each model response.' }, selector: '[data-guide="chat-input"]' },
        { id: 'wishes-btn', label: { ru: 'Пожелания Супервайзера', en: 'Supervisor Wishes' }, description: { ru: 'Добавление специальных инструкций для моделей: фокус, ограничения, стиль ответа.', en: 'Add special instructions for models: focus, constraints, response style.' }, selector: '[data-guide="chat-input"]' },
      ],
      4: [
        { id: 'dchat-selector', label: { ru: 'Селектор модели', en: 'Model Selector' }, description: { ru: 'Выбор модели и роли для приватного D-Chat диалога (Эксперт, Критик, Web-Охотник и др.).', en: 'Select model and role for private D-Chat dialogue (Expert, Critic, Web-Hunter, etc.).' }, selector: '[data-guide="consultant-panel"]' },
        { id: 'dchat-input', label: { ru: 'Поле D-Chat', en: 'D-Chat Input' }, description: { ru: 'Ввод запроса для приватной консультации. Не влияет на основное обсуждение.', en: 'Enter query for private consultation. Does not affect the main discussion.' }, selector: '[data-guide="consultant-panel"]' },
        { id: 'dchat-history', label: { ru: 'История D-Chat', en: 'D-Chat History' }, description: { ru: 'Лента приватных сообщений с выбранным специалистом.', en: 'Private message feed with the selected specialist.' }, selector: '[data-guide="consultant-panel"]' },
      ],
    },
  },

  // ─── Staff Roles Tour ───
  {
    tourId: 'staff-roles',
    steps: {
      0: [
        { id: 'role-cards', label: { ru: 'Карточки ролей', en: 'Role Cards' }, description: { ru: 'Каждая карточка показывает роль с цветной иконкой, названием и кратким описанием.', en: 'Each card shows a role with colored icon, name, and brief description.' }, selector: '[data-guide="staff-list"]' },
        { id: 'expert-group', label: { ru: 'Группа экспертов', en: 'Expert Group' }, description: { ru: '6 ролей для дискуссий: Эксперт, Критик, Арбитр, Консультант, Модератор, Советник.', en: '6 discussion roles: Expert, Critic, Arbiter, Consultant, Moderator, Advisor.' }, selector: '[data-guide="staff-experts-group"]' },
        { id: 'tech-group', label: { ru: 'Технический персонал', en: 'Technical Staff' }, description: { ru: '6 скрытых ролей: Архивариус, Аналитик, Промпт-инженер, Регулятор, Инструменталист, Web-Охотник.', en: '6 hidden roles: Archivist, Analyst, Prompt Engineer, Regulator, Toolsmith, Web-Hunter.' }, selector: '[data-guide="staff-technical-group"]' },
      ],
      1: [
        { id: 'seed-btn', label: { ru: 'Кнопка обучения', en: 'Seed Button' }, description: { ru: 'Загружает предустановленную базу знаний для технических ролей из Гидропедии.', en: 'Seeds a preset knowledge base for technical roles from Hydrapedia.' }, selector: '[data-guide="staff-seed-button"]' },
      ],
      2: [
        { id: 'role-click', label: { ru: 'Клик по роли', en: 'Role Click' }, description: { ru: 'Клик по карточке роли открывает панель настроек в правой части экрана.', en: 'Clicking a role card opens the settings panel on the right side.' }, selector: '[data-guide="staff-list"]' },
      ],
      3: [
        { id: 'system-prompt', label: { ru: 'Системный промпт', en: 'System Prompt' }, description: { ru: 'Редактор системного промпта роли. Определяет характер и экспертизу ИИ-специалиста.', en: 'Role system prompt editor. Defines the character and expertise of the AI specialist.' }, selector: '[data-guide="role-details"]' },
        { id: 'hierarchy-section', label: { ru: 'Иерархия', en: 'Hierarchy' }, description: { ru: 'Связи подчинения между ролями. Определяет порядок консультаций и делегирования.', en: 'Subordination links between roles. Defines consultation and delegation order.' }, selector: '[data-guide="role-details"]' },
        { id: 'behavior-settings', label: { ru: 'Настройки поведения', en: 'Behavior Settings' }, description: { ru: 'Паттерн поведения роли: тон общения, детализация, реакции на триггеры.', en: 'Role behavior pattern: communication tone, verbosity, trigger reactions.' }, selector: '[data-guide="role-details"]' },
        { id: 'knowledge-tab', label: { ru: 'Вкладка «Знания»', en: 'Knowledge Tab' }, description: { ru: 'База знаний роли: документы, статьи и фрагменты с векторным поиском.', en: 'Role knowledge base: documents, articles, and chunks with vector search.' }, selector: '[data-guide="role-details"]' },
        { id: 'prompt-library-btn', label: { ru: 'Библиотека промптов', en: 'Prompt Library' }, description: { ru: 'Выбор готового промпта из библиотеки для быстрой настройки роли.', en: 'Select a ready-made prompt from the library for quick role setup.' }, selector: '[data-guide="role-details"]' },
      ],
      4: [
        { id: 'expert-cards', label: { ru: 'Карточки экспертов', en: 'Expert Cards' }, description: { ru: 'Эксперт (зелёный), Критик (красный), Арбитр (жёлтый), Консультант (голубой), Модератор (фиолетовый), Советник (янтарный).', en: 'Expert (green), Critic (red), Arbiter (yellow), Consultant (blue), Moderator (purple), Advisor (amber).' }, selector: '[data-guide="staff-experts-group"]' },
      ],
      5: [
        { id: 'tech-cards', label: { ru: 'Карточки техников', en: 'Tech Cards' }, description: { ru: 'Архивариус, Аналитик, Промпт-инженер, Регулятор, Инструменталист и Web-Охотник — скрытые сервисные роли.', en: 'Archivist, Analyst, Prompt Engineer, Regulator, Toolsmith, Web-Hunter — hidden service roles.' }, selector: '[data-guide="staff-technical-group"]' },
      ],
    },
  },

  // ─── Model Ratings Tour ───
  {
    tourId: 'model-ratings',
    steps: {
      0: [
        { id: 'portfolio-btn', label: { ru: 'Портфолио', en: 'Portfolio' }, description: { ru: 'Каталог всех ИИ-моделей с провайдерами, ценами и возможностями.', en: 'Catalog of all AI models with providers, pricing, and capabilities.' }, selector: '[data-guide="podium-portfolio-btn"]' },
        { id: 'rules-btn', label: { ru: 'Правила конкурса', en: 'Contest Rules' }, description: { ru: 'Настройка критериев оценки и правил проведения конкурса интеллект-красоты.', en: 'Setup evaluation criteria and rules for the intelligence contest.' }, selector: '[data-guide="podium-rules-btn"]' },
        { id: 'contest-btn', label: { ru: 'Конкурс', en: 'Contest' }, description: { ru: 'Арена соревнований между моделями в реальном времени.', en: 'Real-time competition arena between models.' }, selector: '[data-guide="podium-contest-btn"]' },
        { id: 'ratings-btn', label: { ru: 'Рейтинги', en: 'Ratings' }, description: { ru: 'Итоговая статистика и рейтинги моделей по результатам использования.', en: 'Final statistics and model ratings based on usage.' }, selector: '[data-guide="podium-ratings-btn"]' },
      ],
      1: [
        { id: 'content-area', label: { ru: 'Рабочая область', en: 'Content Area' }, description: { ru: 'Отображает содержимое выбранного раздела — список моделей, настройки или графики.', en: 'Shows the selected section content — model list, settings, or charts.' }, selector: '[data-guide="podium-content"]' },
      ],
      2: [
        { id: 'model-cards', label: { ru: 'Карточки моделей', en: 'Model Cards' }, description: { ru: 'Досье каждой модели: провайдер, семейство, цена за токен, поддерживаемые функции.', en: 'Each model dossier: provider, family, price per token, supported features.' }, selector: '[data-guide="podium-content"]' },
        { id: 'provider-filter', label: { ru: 'Фильтр провайдеров', en: 'Provider Filter' }, description: { ru: 'Фильтрация списка моделей по провайдеру (OpenAI, Google, Anthropic и др.).', en: 'Filter model list by provider (OpenAI, Google, Anthropic, etc.).' }, selector: '[data-guide="podium-content"]' },
      ],
      3: [
        { id: 'stats-chart', label: { ru: 'График статистики', en: 'Stats Chart' }, description: { ru: 'Визуализация рейтингов: количество использований, оценки Арбитра и общий балл.', en: 'Rating visualization: usage count, Arbiter scores, and total score.' }, selector: '[data-guide="podium-content"]' },
      ],
      4: [
        { id: 'task-selector', label: { ru: 'Выбор задания', en: 'Task Selector' }, description: { ru: 'Выбор задания для конкурса — модели отвечают на одинаковый вопрос для сравнения.', en: 'Select a task for the contest — models answer the same question for comparison.' }, selector: '[data-guide="podium-content"]' },
        { id: 'candidate-list', label: { ru: 'Список кандидатов', en: 'Candidate List' }, description: { ru: 'Модели-участники конкурса с их ответами и оценками жюри.', en: 'Contest participant models with their answers and jury scores.' }, selector: '[data-guide="podium-content"]' },
      ],
    },
  },

  // ─── Flow Editor Tour ───
  {
    tourId: 'flow-editor',
    steps: {
      0: [
        { id: 'diagram-name', label: { ru: 'Имя диаграммы', en: 'Diagram Name' }, description: { ru: 'Название текущей диаграммы. Редактируется inline.', en: 'Current diagram name. Editable inline.' }, selector: '[data-guide="flow-toolbar"]' },
        { id: 'edge-style', label: { ru: 'Стиль связей', en: 'Edge Style' }, description: { ru: 'Переключение типа линий: прямые, ломаные или кривые Безье.', en: 'Switch line type: straight, step, or Bezier curves.' }, selector: '[data-guide="flow-toolbar"]' },
        { id: 'undo-redo', label: { ru: 'Undo / Redo', en: 'Undo / Redo' }, description: { ru: 'Отмена и повтор последних действий на холсте.', en: 'Undo and redo the last canvas actions.' }, selector: '[data-guide="flow-toolbar"]' },
        { id: 'auto-layout', label: { ru: 'Авто-раскладка', en: 'Auto Layout' }, description: { ru: 'Автоматическая компоновка узлов с помощью алгоритма Dagre.', en: 'Automatic node arrangement using the Dagre algorithm.' }, selector: '[data-guide="flow-toolbar"]' },
        { id: 'logistics-btn', label: { ru: 'Логистика', en: 'Logistics' }, description: { ru: 'ИИ-анализ диаграммы: оптимизация, выявление узких мест и рекомендации.', en: 'AI diagram analysis: optimization, bottleneck detection, and recommendations.' }, selector: '[data-guide="flow-toolbar"]' },
      ],
      1: [
        { id: 'node-categories', label: { ru: 'Категории узлов', en: 'Node Categories' }, description: { ru: 'Узлы сгруппированы: Core (Input/Output), AI (Model/Prompt), Logic (Condition/Switch) и Data.', en: 'Nodes grouped: Core (Input/Output), AI (Model/Prompt), Logic (Condition/Switch), and Data.' }, selector: '[data-guide="flow-sidebar"]' },
        { id: 'drag-handle', label: { ru: 'Перетаскивание', en: 'Drag Handle' }, description: { ru: 'Перетащите узел из палитры на холст для добавления в диаграмму.', en: 'Drag a node from the palette onto the canvas to add it to the diagram.' }, selector: '[data-guide="flow-sidebar"]' },
      ],
      2: [
        { id: 'canvas-area', label: { ru: 'Область холста', en: 'Canvas Area' }, description: { ru: 'Интерактивный холст: масштабирование колёсиком, перемещение перетаскиванием фона.', en: 'Interactive canvas: zoom with scroll wheel, pan by dragging the background.' }, selector: '[data-guide="flow-canvas"]' },
        { id: 'node-ports', label: { ru: 'Порты узлов', en: 'Node Ports' }, description: { ru: 'Входные и выходные точки подключения. Перетащите от выхода к входу для создания связи.', en: 'Input and output connection points. Drag from output to input to create a connection.' }, selector: '[data-guide="flow-canvas"]' },
        { id: 'edge-labels', label: { ru: 'Метки связей', en: 'Edge Labels' }, description: { ru: 'Условия и метки на линиях связи. Кликните для редактирования.', en: 'Conditions and labels on connection lines. Click to edit.' }, selector: '[data-guide="flow-canvas"]' },
      ],
      3: [
        { id: 'save-btn', label: { ru: 'Сохранить', en: 'Save' }, description: { ru: 'Сохраняет текущую диаграмму в базу данных.', en: 'Saves the current diagram to the database.' }, selector: '[data-guide="flow-header-actions"]' },
        { id: 'load-btn', label: { ru: 'Загрузить', en: 'Load' }, description: { ru: 'Открывает список сохранённых диаграмм для загрузки.', en: 'Opens the list of saved diagrams for loading.' }, selector: '[data-guide="flow-header-actions"]' },
        { id: 'export-btn', label: { ru: 'Экспорт', en: 'Export' }, description: { ru: 'Экспорт диаграммы в PNG, SVG, JSON, YAML или Mermaid-код.', en: 'Export diagram to PNG, SVG, JSON, YAML, or Mermaid code.' }, selector: '[data-guide="flow-header-actions"]' },
        { id: 'new-btn', label: { ru: 'Новая диаграмма', en: 'New Diagram' }, description: { ru: 'Очищает холст и создаёт новую пустую диаграмму.', en: 'Clears the canvas and creates a new empty diagram.' }, selector: '[data-guide="flow-header-actions"]' },
      ],
      4: [
        { id: 'execute-btn', label: { ru: 'Кнопка запуска', en: 'Execute Button' }, description: { ru: 'Запускает выполнение потока. Данные проходят по связям от Input до Output.', en: 'Runs the flow. Data travels through connections from Input to Output.' }, selector: '[data-guide="flow-execute-btn"]' },
        { id: 'execution-panel', label: { ru: 'Панель выполнения', en: 'Execution Panel' }, description: { ru: 'Отображает прогресс, результаты и ошибки при выполнении потока.', en: 'Shows progress, results, and errors during flow execution.' }, selector: '[data-guide="flow-canvas"]' },
      ],
    },
  },

  // ─── Prompt Library Tour ───
  {
    tourId: 'role-library',
    steps: {
      0: [
        { id: 'prompt-rows', label: { ru: 'Строки промптов', en: 'Prompt Rows' }, description: { ru: 'Каждая строка — промпт с названием, ролью, языком и счётчиком использований.', en: 'Each row is a prompt with name, role, language, and usage count.' }, selector: '[data-guide="prompt-list"]' },
        { id: 'lang-groups', label: { ru: 'Группировка по языку', en: 'Language Groups' }, description: { ru: 'Промпты сгруппированы по языку (RU/EN) с заголовками секций.', en: 'Prompts grouped by language (RU/EN) with section headers.' }, selector: '[data-guide="prompt-list"]' },
      ],
      1: [
        { id: 'search-input', label: { ru: 'Поиск', en: 'Search' }, description: { ru: 'Полнотекстовый поиск по названию и содержимому промптов.', en: 'Full-text search by prompt name and content.' }, selector: '[data-guide="prompt-filters"]' },
        { id: 'role-filter', label: { ru: 'Фильтр по роли', en: 'Role Filter' }, description: { ru: 'Выпадающий список для фильтрации промптов по ИИ-роли.', en: 'Dropdown to filter prompts by AI role.' }, selector: '[data-guide="prompt-filters"]' },
        { id: 'owner-filter', label: { ru: 'Фильтр владельца', en: 'Owner Filter' }, description: { ru: 'Переключатель: все / мои / общие / системные промпты.', en: 'Toggle: all / mine / shared / system prompts.' }, selector: '[data-guide="prompt-filters"]' },
      ],
      2: [
        { id: 'create-btn', label: { ru: 'Кнопка создания', en: 'Create Button' }, description: { ru: 'Открывает форму для создания нового промпта с выбором роли и языка.', en: 'Opens a form to create a new prompt with role and language selection.' }, selector: '[data-guide="prompt-create-btn"]' },
      ],
      3: [
        { id: 'prompt-click', label: { ru: 'Клик по промпту', en: 'Prompt Click' }, description: { ru: 'Выделяет промпт и открывает панель деталей в правой части.', en: 'Selects the prompt and opens the details panel on the right.' }, selector: '[data-guide="prompt-list"]' },
      ],
      4: [
        { id: 'content-editor', label: { ru: 'Редактор содержимого', en: 'Content Editor' }, description: { ru: 'Полный текст промпта с поддержкой Markdown и подсветкой синтаксиса.', en: 'Full prompt text with Markdown support and syntax highlighting.' }, selector: '[data-guide="prompt-details"]' },
        { id: 'meta-fields', label: { ru: 'Метаданные', en: 'Metadata' }, description: { ru: 'Название, описание, роль, язык, теги и настройки видимости промпта.', en: 'Name, description, role, language, tags, and visibility settings.' }, selector: '[data-guide="prompt-details"]' },
        { id: 'usage-stats', label: { ru: 'Статистика', en: 'Statistics' }, description: { ru: 'Счётчик использований промпта и дата последнего изменения.', en: 'Prompt usage counter and last modification date.' }, selector: '[data-guide="prompt-details"]' },
      ],
    },
  },

  // ─── Tools Library Tour ───
  {
    tourId: 'tools-library',
    steps: {
      0: [
        { id: 'tool-rows', label: { ru: 'Строки инструментов', en: 'Tool Rows' }, description: { ru: 'Каждая строка — инструмент с иконкой типа, названием, категорией и статистикой.', en: 'Each row is a tool with type icon, name, category, and stats.' }, selector: '[data-guide="tools-list"]' },
        { id: 'category-groups', label: { ru: 'Группировка по категории', en: 'Category Groups' }, description: { ru: 'Инструменты сгруппированы: AI, Data, Integration и другие.', en: 'Tools grouped: AI, Data, Integration, and others.' }, selector: '[data-guide="tools-list"]' },
      ],
      1: [
        { id: 'search-input', label: { ru: 'Поиск', en: 'Search' }, description: { ru: 'Поиск по названию и описанию инструментов.', en: 'Search by tool name and description.' }, selector: '[data-guide="tools-filters"]' },
        { id: 'owner-filter', label: { ru: 'Фильтр владельца', en: 'Owner Filter' }, description: { ru: 'Переключатель: все / системные / мои / общие инструменты.', en: 'Toggle: all / system / mine / shared tools.' }, selector: '[data-guide="tools-filters"]' },
      ],
      2: [
        { id: 'create-btn', label: { ru: 'Кнопка создания', en: 'Create Button' }, description: { ru: 'Создание нового Prompt-tool или HTTP API-tool.', en: 'Create a new Prompt tool or HTTP API tool.' }, selector: '[data-guide="tools-create-btn"]' },
      ],
      3: [
        { id: 'import-btn', label: { ru: 'Кнопка импорта', en: 'Import Button' }, description: { ru: 'Импорт инструмента из JSON-файла для быстрого обмена.', en: 'Import a tool from a JSON file for quick sharing.' }, selector: '[data-guide="tools-import-btn"]' },
      ],
      4: [
        { id: 'tool-click', label: { ru: 'Клик по инструменту', en: 'Tool Click' }, description: { ru: 'Выделяет инструмент и открывает панель деталей справа.', en: 'Selects the tool and opens the details panel on the right.' }, selector: '[data-guide="tools-list"]' },
      ],
      5: [
        { id: 'params-section', label: { ru: 'Параметры', en: 'Parameters' }, description: { ru: 'JSON Schema параметров инструмента: имя, тип, описание и обязательность.', en: 'Tool parameter JSON Schema: name, type, description, and required status.' }, selector: '[data-guide="tools-details"]' },
        { id: 'template-editor', label: { ru: 'Шаблон промпта', en: 'Prompt Template' }, description: { ru: 'Для Prompt-tool: текстовый шаблон с подстановкой переменных {{param}}.', en: 'For Prompt tools: text template with {{param}} variable substitution.' }, selector: '[data-guide="tools-details"]' },
        { id: 'http-config', label: { ru: 'HTTP-конфиг', en: 'HTTP Config' }, description: { ru: 'Для HTTP-tool: URL, метод, заголовки и тело запроса.', en: 'For HTTP tools: URL, method, headers, and request body.' }, selector: '[data-guide="tools-details"]' },
        { id: 'tester-section', label: { ru: 'Тестер', en: 'Tester' }, description: { ru: 'Встроенный тестер: введите параметры и выполните инструмент прямо из панели деталей.', en: 'Built-in tester: enter parameters and execute the tool right from the details panel.' }, selector: '[data-guide="tools-details"]' },
        { id: 'usage-badge', label: { ru: 'Статистика', en: 'Usage Stats' }, description: { ru: 'Счётчик использований, дата создания и последнего обновления.', en: 'Usage counter, creation date, and last update.' }, selector: '[data-guide="tools-details"]' },
      ],
    },
  },

  // ─── Behavioral Patterns Tour ───
  {
    tourId: 'behavioral-patterns',
    steps: {
      0: [
        { id: 'pattern-rows', label: { ru: 'Строки паттернов', en: 'Pattern Rows' }, description: { ru: 'Каждая строка — паттерн с типом (Blueprint/Behavior), названием и категорией.', en: 'Each row is a pattern with type (Blueprint/Behavior), name, and category.' }, selector: '[data-guide="patterns-list"]' },
        { id: 'type-groups', label: { ru: 'Группировка по типу', en: 'Type Groups' }, description: { ru: 'Паттерны разделены на стратегические рецепты и ролевые паттерны.', en: 'Patterns split into strategic blueprints and role behaviors.' }, selector: '[data-guide="patterns-list"]' },
      ],
      1: [
        { id: 'blueprint-cards', label: { ru: 'Карточки рецептов', en: 'Blueprint Cards' }, description: { ru: 'Стратегические рецепты с этапами, ролями-исполнителями и контрольными точками.', en: 'Strategic blueprints with stages, role assignments, and checkpoints.' }, selector: '[data-guide="patterns-strategic-group"]' },
      ],
      2: [
        { id: 'behavior-cards', label: { ru: 'Карточки поведений', en: 'Behavior Cards' }, description: { ru: 'Ролевые паттерны с тоном общения, детализацией и настройками реакций.', en: 'Role behaviors with communication tone, verbosity, and reaction settings.' }, selector: '[data-guide="patterns-behavior-group"]' },
      ],
      3: [
        { id: 'pattern-click', label: { ru: 'Клик по паттерну', en: 'Pattern Click' }, description: { ru: 'Выделяет паттерн и открывает панель деталей в правой части.', en: 'Selects the pattern and opens the details panel on the right.' }, selector: '[data-guide="patterns-list"]' },
      ],
      4: [
        { id: 'inline-editor', label: { ru: 'Inline-редактор', en: 'Inline Editor' }, description: { ru: 'Редактирование параметров прямо в панели деталей без открытия диалога.', en: 'Edit parameters right in the details panel without opening a dialog.' }, selector: '[data-guide="patterns-details"]' },
        { id: 'reaction-badges', label: { ru: 'Бейджи реакций', en: 'Reaction Badges' }, description: { ru: 'Визуальные бейджи с тултипами для быстрого просмотра настроенных реакций.', en: 'Visual badges with tooltips for quick view of configured reactions.' }, selector: '[data-guide="patterns-details"]' },
        { id: 'flow-integration', label: { ru: 'Интеграция с потоками', en: 'Flow Integration' }, description: { ru: 'Кнопка генерации диаграммы потока из стратегического рецепта.', en: 'Button to generate a flow diagram from a strategic blueprint.' }, selector: '[data-guide="patterns-details"]' },
      ],
      5: [
        { id: 'create-blueprint-btn', label: { ru: 'Создать рецепт', en: 'Create Blueprint' }, description: { ru: 'Открывает диалог создания нового стратегического рецепта с мастером этапов.', en: 'Opens dialog to create a new strategic blueprint with stage wizard.' }, selector: '[data-guide="patterns-create-blueprint"]' },
        { id: 'create-behavior-btn', label: { ru: 'Создать паттерн', en: 'Create Behavior' }, description: { ru: 'Открывает диалог создания нового ролевого паттерна поведения.', en: 'Opens dialog to create a new role behavior pattern.' }, selector: '[data-guide="patterns-behavior-group"]' },
      ],
    },
  },
];

/**
 * Get panel elements for a specific tour step.
 */
export function getPanelElements(tourId: string, stepIndex: number): PanelElement[] {
  const tourData = TOUR_PANEL_ELEMENTS.find(t => t.tourId === tourId);
  if (!tourData) return [];
  return tourData.steps[stepIndex] ?? [];
}
