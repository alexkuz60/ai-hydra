
-- Update generic welcome panel elements with proper labels and descriptions
UPDATE guide_panel_elements SET
  label_ru = 'Менеджер задач',
  label_en = 'Task Manager',
  description_ru = 'Создание задач, привязка моделей, файлы и переход к обсуждению. Каждая задача — отдельная сессия.',
  description_en = 'Create tasks, bind models, files and open discussions. Each task is a separate session.'
WHERE tour_id = 'welcome' AND step_index = 1 AND element_id = 'nav-link';

UPDATE guide_panel_elements SET
  label_ru = 'Штат специалистов',
  label_en = 'AI Staff',
  description_ru = '13 ИИ-ролей: от Эксперта до Экскурсовода. Настройте промпты, иерархию и знания каждой роли.',
  description_en = '13 AI roles: from Expert to Guide. Configure prompts, hierarchy and knowledge for each role.'
WHERE tour_id = 'welcome' AND step_index = 2 AND element_id = 'nav-link';

UPDATE guide_panel_elements SET
  label_ru = 'Панель экспертов',
  label_en = 'Expert Panel',
  description_ru = 'Главная арена: коллегиальное обсуждение с Экспертом, Критиком и Арбитром. D-Chat для приватных консультаций.',
  description_en = 'Main arena: collegial discussion with Expert, Critic and Arbiter. D-Chat for private consultations.'
WHERE tour_id = 'welcome' AND step_index = 3 AND element_id = 'nav-link';

UPDATE guide_panel_elements SET
  label_ru = 'Гидропедия',
  label_en = 'Hydrapedia',
  description_ru = 'Встроенная энциклопедия платформы. Разделы по ролям, функциям, настройкам и FAQ.',
  description_en = 'Built-in platform encyclopedia. Sections on roles, features, settings and FAQ.'
WHERE tour_id = 'welcome' AND step_index = 4 AND element_id = 'nav-link';

-- Add new welcome steps for remaining navigation sections
INSERT INTO guide_tour_steps (tour_id, step_index, title_ru, title_en, description_ru, description_en, selector, placement, route)
VALUES
  ('welcome', 5, 'Подиум ИИ-моделей', 'AI Model Podium',
   'Портфолио, досье, рейтинги и конкурсы красоты ИИ-моделей. Отслеживайте эффективность каждой модели.',
   'Portfolio, dossiers, ratings and beauty contests for AI models. Track each model''s performance.',
   'a[href="/model-ratings"]', 'right', NULL),
  ('welcome', 6, 'Редактор потоков', 'Flow Editor',
   'Визуальный конструктор цепочек обработки данных: узлы, связи, авто-раскладка и запуск.',
   'Visual constructor for data processing chains: nodes, connections, auto-layout and execution.',
   'a[href="/flow-editor"]', 'right', NULL),
  ('welcome', 7, 'Библиотека промптов', 'Prompt Library',
   'Централизованное хранилище системных промптов. Создавайте, редактируйте и переиспользуйте в сессиях.',
   'Centralized storage of system prompts. Create, edit and reuse across sessions.',
   'a[href="/role-library"]', 'right', NULL),
  ('welcome', 8, 'Инструменты ИИ', 'AI Tools',
   'Prompt- и HTTP-инструменты, расширяющие возможности ИИ-ролей. Встроенные тестеры для отладки.',
   'Prompt and HTTP tools extending AI role capabilities. Built-in testers for debugging.',
   'a[href="/tools-library"]', 'right', NULL),
  ('welcome', 9, 'Паттерны поведения', 'Behavioral Patterns',
   'Стратегические рецепты и ролевые паттерны: шаблоны многоэтапных задач и настройка коммуникации.',
   'Strategic blueprints and role patterns: multi-stage task templates and communication settings.',
   'a[href="/behavioral-patterns"]', 'right', NULL),
  ('welcome', 10, 'Профиль и ключи', 'Profile & API Keys',
   'Управление API-ключами провайдеров, настройки ProxyAPI и персонализация интерфейса.',
   'Manage provider API keys, ProxyAPI settings and interface personalization.',
   'a[href="/profile"]', 'right', NULL);

-- Panel elements for new welcome steps
INSERT INTO guide_panel_elements (tour_id, step_index, element_id, label_ru, label_en, description_ru, description_en, selector, sort_order)
VALUES
  ('welcome', 5, 'podium-nav', 'Подиум моделей', 'Model Podium',
   'Раздел с 4 вкладками: Портфолио, Рейтинги, Конкурс красоты и Правила.',
   'Section with 4 tabs: Portfolio, Ratings, Beauty Contest and Rules.',
   NULL, 0),
  ('welcome', 6, 'flow-nav', 'Редактор потоков', 'Flow Editor',
   'Визуальный конструктор с палитрой узлов (15+ типов) и автоматической раскладкой.',
   'Visual constructor with node palette (15+ types) and automatic layout.',
   NULL, 0),
  ('welcome', 7, 'prompts-nav', 'Библиотека промптов', 'Prompt Library',
   'Промпты с группировкой по языку (RU/EN) и привязкой к ИИ-ролям. Секционный редактор.',
   'Prompts grouped by language (RU/EN) and bound to AI roles. Sectioned editor.',
   NULL, 0),
  ('welcome', 8, 'tools-nav', 'Инструменты', 'Tools',
   'Два типа: Prompt Tool (шаблон промпта) и HTTP Tool (вызов внешнего API).',
   'Two types: Prompt Tool (prompt template) and HTTP Tool (external API call).',
   NULL, 0),
  ('welcome', 9, 'patterns-nav', 'Паттерны', 'Patterns',
   'Стратегические рецепты (Task Blueprints) с этапами и контрольными точками. Ролевые паттерны (Behaviors).',
   'Strategic blueprints (Task Blueprints) with stages and checkpoints. Role patterns (Behaviors).',
   NULL, 0),
  ('welcome', 10, 'profile-nav', 'Профиль', 'Profile',
   'Ключи для 12 ИИ-провайдеров, дашборд ProxyAPI и настройки пользователя.',
   'Keys for 12 AI providers, ProxyAPI dashboard and user settings.',
   NULL, 0);
