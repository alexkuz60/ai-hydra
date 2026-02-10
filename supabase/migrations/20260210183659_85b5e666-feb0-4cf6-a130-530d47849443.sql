
-- Add 3 new steps to the Prompt Library tour (role-library)
-- Step 5: Advanced Prompt Editor (metadata + sections)
-- Step 6: Sections Editor (per-section editing)
-- Step 7: Usage in Chat (PromptLibraryPicker via Ctrl+K)

INSERT INTO guide_tour_steps (tour_id, step_index, title_ru, title_en, description_ru, description_en, selector, placement, route)
VALUES
  ('role-library', 5, 'Расширенный редактор', 'Advanced Editor',
   'Полноэкранный редактор промпта с метаданными (имя, роль, язык, видимость) и секционным редактором содержимого.',
   'Full-screen prompt editor with metadata (name, role, language, visibility) and sectioned content editor.',
   '[data-guide="prompt-advanced-editor"]', 'left', NULL),
  ('role-library', 6, 'Секционный редактор', 'Sections Editor',
   'Содержимое промпта разбито на секции (## заголовки). Каждую секцию можно редактировать отдельно, переименовывать и переупорядочивать.',
   'Prompt content is split into sections (## headers). Each section can be edited, renamed, and reordered independently.',
   '[data-guide="prompt-sections-editor"]', 'left', NULL),
  ('role-library', 7, 'Использование в чате', 'Usage in Chat',
   'Нажмите Ctrl+K или кнопку библиотеки в поле ввода, чтобы открыть пикер промптов. Выберите промпт — он станет системным для текущей сессии.',
   'Press Ctrl+K or the library button in the input area to open the prompt picker. Select a prompt — it becomes the system prompt for the current session.',
   '[data-guide="prompt-library-picker-btn"]', 'top', '/expert-panel');

-- Panel elements for Step 5: Advanced Editor
INSERT INTO guide_panel_elements (tour_id, step_index, element_id, label_ru, label_en, description_ru, description_en, selector, sort_order)
VALUES
  ('role-library', 5, 'editor-nickname', 'Отображаемое имя', 'Display Name',
   'Имя промпта, видимое в списке. Из него автоматически генерируется техническое имя.',
   'Prompt name visible in the list. A technical name is auto-generated from it.',
   NULL, 0),
  ('role-library', 5, 'editor-role-select', 'Выбор роли', 'Role Select',
   'Выпадающий список для привязки промпта к ИИ-роли (Эксперт, Критик, Арбитр и др.).',
   'Dropdown to bind the prompt to an AI role (Expert, Critic, Arbiter, etc.).',
   NULL, 10),
  ('role-library', 5, 'editor-language', 'Язык промпта', 'Prompt Language',
   'Выбор языка: RU, EN или Авто (определяется автоматически по содержимому).',
   'Language selection: RU, EN, or Auto (detected automatically from content).',
   NULL, 20),
  ('role-library', 5, 'editor-shared-toggle', 'Переключатель видимости', 'Visibility Toggle',
   'Включите, чтобы промпт был доступен всем пользователям. Выключен — виден только вам.',
   'Enable to make the prompt available to all users. Disabled — visible only to you.',
   NULL, 30),
  ('role-library', 5, 'editor-tech-name', 'Техническое имя', 'Technical Name',
   'Автоматически генерируемый идентификатор вида role_language_nickname. Используется внутри системы.',
   'Auto-generated identifier like role_language_nickname. Used internally by the system.',
   NULL, 40),
  ('role-library', 5, 'editor-description', 'Описание', 'Description',
   'Краткое описание назначения промпта. Отображается в списке и помогает при поиске.',
   'Short description of the prompt purpose. Shown in the list and helps with search.',
   NULL, 50),
  ('role-library', 5, 'editor-save-btn', 'Кнопки Сохранить / Отмена', 'Save / Cancel Buttons',
   'Сохранить промпт в библиотеку или отменить редактирование.',
   'Save the prompt to the library or cancel editing.',
   NULL, 60);

-- Panel elements for Step 6: Sections Editor
INSERT INTO guide_panel_elements (tour_id, step_index, element_id, label_ru, label_en, description_ru, description_en, selector, sort_order)
VALUES
  ('role-library', 6, 'section-nav', 'Навигация по секциям', 'Section Navigation',
   'Вертикальный список секций слева. Клик переключает активную секцию в редакторе.',
   'Vertical section list on the left. Click switches the active section in the editor.',
   NULL, 0),
  ('role-library', 6, 'section-title-edit', 'Заголовок секции', 'Section Title',
   'Заголовок (## ...) текущей секции. Можно переименовать прямо в редакторе.',
   'Heading (## ...) of the current section. Can be renamed directly in the editor.',
   NULL, 10),
  ('role-library', 6, 'section-content', 'Содержимое секции', 'Section Content',
   'Текстовое поле с содержимым выбранной секции. Поддерживает Markdown-разметку.',
   'Text area with the selected section content. Supports Markdown formatting.',
   NULL, 20),
  ('role-library', 6, 'section-add-delete', 'Добавление и удаление', 'Add and Delete',
   'Кнопки для добавления новой секции или удаления текущей. Минимум одна секция обязательна.',
   'Buttons to add a new section or delete the current one. At least one section is required.',
   NULL, 30),
  ('role-library', 6, 'section-preview', 'Предпросмотр', 'Preview',
   'Превью собранного промпта в реальном времени. Показывает, как секции соберутся в финальный текст.',
   'Real-time preview of the assembled prompt. Shows how sections compile into the final text.',
   NULL, 40);

-- Panel elements for Step 7: Usage in Chat
INSERT INTO guide_panel_elements (tour_id, step_index, element_id, label_ru, label_en, description_ru, description_en, selector, sort_order)
VALUES
  ('role-library', 7, 'picker-shortcut', 'Горячая клавиша Ctrl+K', 'Ctrl+K Shortcut',
   'Быстрый вызов пикера промптов из любого экрана чата комбинацией Ctrl+K.',
   'Quick access to the prompt picker from any chat screen using Ctrl+K.',
   NULL, 0),
  ('role-library', 7, 'picker-search', 'Поиск в пикере', 'Picker Search',
   'Полнотекстовый поиск по названию и содержимому промптов. Фильтр по роли.',
   'Full-text search by prompt name and content. Role filter.',
   NULL, 10),
  ('role-library', 7, 'picker-lang-groups', 'Группировка RU/EN', 'RU/EN Grouping',
   'Промпты в пикере сгруппированы по языку. Группы можно сворачивать/разворачивать.',
   'Prompts in the picker are grouped by language. Groups can be collapsed/expanded.',
   NULL, 20),
  ('role-library', 7, 'picker-select', 'Выбор промпта', 'Select Prompt',
   'Кликните на промпт — он станет системным промптом для текущей сессии. Счётчик использований увеличится.',
   'Click a prompt — it becomes the system prompt for the current session. Usage counter increments.',
   NULL, 30),
  ('role-library', 7, 'picker-delete-own', 'Удаление своих промптов', 'Delete Own Prompts',
   'В пикере можно удалить свои промпты кнопкой корзины. Системные и чужие промпты удалить нельзя.',
   'You can delete your own prompts in the picker with the trash button. System and others prompts cannot be deleted.',
   NULL, 40);
