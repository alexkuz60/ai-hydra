
-- Create new tour: AI Hydra Memory
INSERT INTO guide_tours (id, title_ru, title_en, description_ru, description_en, icon, sort_order, is_active)
VALUES (
  'ai-memory',
  'Память ИИ-Гидры',
  'AI Hydra Memory',
  'Система памяти сессий, ролевая память и управление знаниями',
  'Session memory system, role memory and knowledge management',
  'Brain',
  10,
  true
);

-- Step 0: Memory Controls (header bar)
INSERT INTO guide_tour_steps (tour_id, step_index, title_ru, title_en, description_ru, description_en, selector, placement, route)
VALUES
  ('ai-memory', 0, 'Панель управления памятью', 'Memory Controls',
   'Бейджи и кнопки в заголовке сессии: статистика фрагментов памяти, база знаний (RAG), кнопка «Освежить память» и вход в редактор.',
   'Badges and buttons in the session header: memory chunk statistics, knowledge base (RAG), "Refresh Memory" button and editor access.',
   '[data-guide="memory-controls"]', 'bottom', '/expert-panel'),

-- Step 1: Save to Memory (message action)
  ('ai-memory', 1, 'Сохранение в память', 'Save to Memory',
   'Кнопка 📦 в действиях с сообщением сохраняет ответ ИИ как фрагмент памяти. Автоматическое сохранение срабатывает при высоких оценках и ключевых решениях.',
   'The 📦 button in message actions saves an AI response as a memory chunk. Auto-saving triggers on high ratings and key decisions.',
   '[data-guide="memory-save-action"]', 'top', NULL),

-- Step 2: Session Memory Dialog
  ('ai-memory', 2, 'Редактор памяти сессии', 'Session Memory Editor',
   'Полнофункциональный диалог управления фрагментами памяти текущей сессии: фильтрация по типу, семантический поиск, удаление дубликатов и очистка.',
   'Full-featured dialog for managing memory chunks of the current session: type filtering, semantic search, duplicate removal and clearing.',
   '[data-guide="memory-dialog"]', 'right', NULL),

-- Step 3: Role Memory
  ('ai-memory', 3, 'Ролевая память', 'Role Memory',
   'Долгосрочная память, привязанная к конкретной ИИ-роли. Накапливает решения, предпочтения и инструкции между сессиями.',
   'Long-term memory bound to a specific AI role. Accumulates decisions, preferences and instructions across sessions.',
   '[data-guide="role-memory-section"]', 'left', '/staff'),

-- Step 4: Knowledge Base (RAG)
  ('ai-memory', 4, 'База знаний (RAG)', 'Knowledge Base (RAG)',
   'Профильные знания роли, загруженные из документов и веб-источников. Используются для контекстного поиска (Retrieval-Augmented Generation).',
   'Role-specific knowledge loaded from documents and web sources. Used for contextual retrieval (Retrieval-Augmented Generation).',
   '[data-guide="role-knowledge-section"]', 'left', '/staff');

-- Panel elements for Step 0: Memory Controls
INSERT INTO guide_panel_elements (tour_id, step_index, element_id, label_ru, label_en, description_ru, description_en, selector, sort_order)
VALUES
  ('ai-memory', 0, 'memory-badge', 'Бейдж памяти', 'Memory Badge',
   'Показывает общее количество сохранённых фрагментов. В тултипе — разбивка по типам: решения, контекст, инструкции, оценки.',
   'Shows total saved chunks count. Tooltip breaks down by type: decisions, context, instructions, evaluations.',
   NULL, 0),
  ('ai-memory', 0, 'knowledge-badge', 'Бейдж знаний (RAG)', 'Knowledge Badge (RAG)',
   'Количество профильных знаний, загруженных в систему RAG. В тултипе — распределение по ролям с цветными иконками.',
   'Number of domain knowledge entries loaded into the RAG system. Tooltip shows distribution by role with colored icons.',
   NULL, 10),
  ('ai-memory', 0, 'refresh-btn', 'Кнопка «Освежить память»', 'Refresh Memory Button',
   'Принудительно обновляет память сессии. Иконка вращается во время загрузки и превращается в ✓ при успехе.',
   'Force-refreshes session memory. Icon spins during loading and turns into ✓ on success.',
   NULL, 20),
  ('ai-memory', 0, 'settings-btn', 'Кнопка редактора', 'Editor Button',
   'Открывает полноэкранный диалог «Редактор памяти сессии» для детального управления фрагментами.',
   'Opens the full-screen "Session Memory Editor" dialog for detailed chunk management.',
   NULL, 30);

-- Panel elements for Step 1: Save to Memory
INSERT INTO guide_panel_elements (tour_id, step_index, element_id, label_ru, label_en, description_ru, description_en, selector, sort_order)
VALUES
  ('ai-memory', 1, 'save-btn', 'Кнопка сохранения 📦', 'Save Button 📦',
   'Нажмите для сохранения ответа ИИ в память сессии. Анимация пульсации указывает на процесс сохранения.',
   'Click to save AI response to session memory. Pulse animation indicates saving process.',
   NULL, 0),
  ('ai-memory', 1, 'auto-save', 'Автоматическое сохранение', 'Auto-save',
   'Система автоматически сохраняет сообщения с высокими оценками Арбитра (≥7) и ключевыми решениями.',
   'System automatically saves messages with high Arbiter ratings (≥7) and key decisions.',
   NULL, 10),
  ('ai-memory', 1, 'saved-indicator', 'Индикатор «Сохранено»', 'Saved Indicator',
   'Зелёная галочка ✓ и изменение цвета кнопки указывают, что сообщение уже сохранено в памяти.',
   'Green checkmark ✓ and button color change indicate the message is already saved to memory.',
   NULL, 20);

-- Panel elements for Step 2: Session Memory Dialog
INSERT INTO guide_panel_elements (tour_id, step_index, element_id, label_ru, label_en, description_ru, description_en, selector, sort_order)
VALUES
  ('ai-memory', 2, 'type-filter', 'Фильтр по типу', 'Type Filter',
   'Фильтрация фрагментов по категориям: решения, контекст, инструкции, оценки, резюме, сообщения.',
   'Filter chunks by categories: decisions, context, instructions, evaluations, summaries, messages.',
   NULL, 0),
  ('ai-memory', 2, 'semantic-search', 'Семантический поиск', 'Semantic Search',
   'Поиск по смыслу через эмбеддинги (text-embedding-3-small). Найдите релевантные фрагменты даже при неточном совпадении текста.',
   'Semantic search via embeddings (text-embedding-3-small). Find relevant chunks even with inexact text match.',
   NULL, 10),
  ('ai-memory', 2, 'chunk-card', 'Карточка фрагмента', 'Chunk Card',
   'Каждый фрагмент отображается с типом, датой, содержимым и кнопками действий (копировать, удалить).',
   'Each chunk displays type, date, content and action buttons (copy, delete).',
   NULL, 20),
  ('ai-memory', 2, 'duplicate-detect', 'Обнаружение дубликатов', 'Duplicate Detection',
   'Автоматическое обнаружение дубликатов через нормализацию текста. Массовое удаление с двухэтапным подтверждением.',
   'Automatic duplicate detection via text normalization. Batch deletion with two-step confirmation.',
   NULL, 30),
  ('ai-memory', 2, 'clear-all', 'Очистить всю память', 'Clear All Memory',
   'Удаление всех фрагментов памяти сессии. Защищено двухэтапным подтверждением с возможностью отмены.',
   'Delete all session memory chunks. Protected by two-step confirmation with cancellation option.',
   NULL, 40);

-- Panel elements for Step 3: Role Memory
INSERT INTO guide_panel_elements (tour_id, step_index, element_id, label_ru, label_en, description_ru, description_en, selector, sort_order)
VALUES
  ('ai-memory', 3, 'role-memory-list', 'Список воспоминаний', 'Memory List',
   'Все долгосрочные воспоминания роли: решения, предпочтения, инструкции. Сортировка по частоте использования.',
   'All long-term role memories: decisions, preferences, instructions. Sorted by usage frequency.',
   NULL, 0),
  ('ai-memory', 3, 'memory-types', 'Типы памяти', 'Memory Types',
   'Категоризация: решения (💡), контекст (📖), инструкции (📋), оценки (⭐). Каждый тип имеет свой цвет и иконку.',
   'Categorization: decisions (💡), context (📖), instructions (📋), evaluations (⭐). Each type has its own color and icon.',
   NULL, 10),
  ('ai-memory', 3, 'cross-session', 'Межсессионная передача', 'Cross-session Transfer',
   'Воспоминания роли автоматически подгружаются во все новые сессии, обеспечивая непрерывность контекста.',
   'Role memories are automatically loaded into all new sessions, ensuring context continuity.',
   NULL, 20);

-- Panel elements for Step 4: Knowledge Base
INSERT INTO guide_panel_elements (tour_id, step_index, element_id, label_ru, label_en, description_ru, description_en, selector, sort_order)
VALUES
  ('ai-memory', 4, 'knowledge-sources', 'Источники знаний', 'Knowledge Sources',
   'Документы и веб-страницы, загруженные как профильные знания роли. Каждый источник разбивается на чанки с эмбеддингами.',
   'Documents and web pages loaded as role domain knowledge. Each source is chunked with embeddings.',
   NULL, 0),
  ('ai-memory', 4, 'rag-search', 'Контекстный поиск (RAG)', 'Contextual Search (RAG)',
   'При каждом запросе система находит релевантные фрагменты знаний и добавляет их в контекст ИИ-роли.',
   'On each query, the system finds relevant knowledge fragments and adds them to the AI role context.',
   NULL, 10),
  ('ai-memory', 4, 'sync-knowledge', 'Синхронизация', 'Synchronization',
   'Знания Экскурсовода синхронизируются с Гидропедией. Остальные роли получают знания через ручную загрузку.',
   'Guide knowledge syncs with Hydrapedia. Other roles receive knowledge through manual upload.',
   NULL, 20);
