-- Insert system Task Blueprints
INSERT INTO public.task_blueprints (name, category, description, stages, checkpoints, is_system, is_shared, user_id)
VALUES
  (
    'Lovable Project Manager',
    'planning',
    'Пошаговое планирование проектов с декомпозицией на задачи, формированием промптов и последовательной реализацией.',
    '[
      {"name": "Анализ требований", "roles": ["advisor"], "objective": "Понять цели проекта, ограничения и ожидаемые результаты", "deliverables": ["Список целей", "Ограничения", "Критерии успеха"]},
      {"name": "Декомпозиция", "roles": ["analyst"], "objective": "Разбить проект на логические этапы и задачи", "deliverables": ["Дерево задач", "Зависимости", "Приоритеты"]},
      {"name": "Формирование запросов", "roles": ["promptengineer"], "objective": "Создать эффективные промпты для каждой задачи", "deliverables": ["Набор промптов", "Инструкции для моделей"]},
      {"name": "Проектирование потока", "roles": ["flowregulator"], "objective": "Спроектировать data-flow диаграмму процесса", "deliverables": ["Flow-диаграмма", "Маршруты данных"]}
    ]'::jsonb,
    '[
      {"after_stage": 0, "condition": "Пользователь подтвердил понимание требований"},
      {"after_stage": 2, "condition": "Пользователь одобрил план и промпты"}
    ]'::jsonb,
    true,
    true,
    NULL
  ),
  (
    'Генеральный Соавтор',
    'creative',
    'Совместная работа над текстом с итеративным улучшением через критику, анализ и финальную редакцию.',
    '[
      {"name": "Черновик", "roles": ["assistant"], "objective": "Создать первоначальный вариант текста", "deliverables": ["Черновик текста"]},
      {"name": "Критический анализ", "roles": ["critic"], "objective": "Выявить слабые места и проблемы", "deliverables": ["Список замечаний", "Рекомендации"]},
      {"name": "Доработка", "roles": ["assistant"], "objective": "Улучшить текст с учётом критики", "deliverables": ["Улучшенный текст"]},
      {"name": "Финальная редакция", "roles": ["arbiter"], "objective": "Синтезировать и финализировать результат", "deliverables": ["Финальный текст"]}
    ]'::jsonb,
    '[{"after_stage": 1, "condition": "Пользователь ознакомился с критикой"}]'::jsonb,
    true,
    true,
    NULL
  ),
  (
    'Технический аудит',
    'technical',
    'Комплексный анализ технического решения с поиском проблем, оценкой архитектуры и формированием рекомендаций.',
    '[
      {"name": "Сбор информации", "roles": ["webhunter", "archivist"], "objective": "Собрать данные о системе и контексте", "deliverables": ["Описание системы", "Документация"]},
      {"name": "Анализ архитектуры", "roles": ["analyst"], "objective": "Проанализировать структуру и паттерны", "deliverables": ["Анализ архитектуры", "Выявленные паттерны"]},
      {"name": "Критическая оценка", "roles": ["critic"], "objective": "Найти уязвимости и проблемы", "deliverables": ["Список проблем", "Оценка рисков"]},
      {"name": "Рекомендации", "roles": ["advisor", "arbiter"], "objective": "Сформировать план улучшений", "deliverables": ["План улучшений", "Приоритеты"]}
    ]'::jsonb,
    '[{"after_stage": 2, "condition": "Пользователь подтвердил полноту анализа"}]'::jsonb,
    true,
    true,
    NULL
  );

-- Insert system Role Behaviors
INSERT INTO public.role_behaviors (name, role, communication, reactions, interactions, is_system, is_shared, user_id)
VALUES
  (
    'Behavior: assistant',
    'assistant',
    '{"tone": "friendly", "verbosity": "adaptive", "format_preference": ["markdown", "lists", "code_blocks"]}'::jsonb,
    '[
      {"trigger": "unclear_question", "behavior": "Запросить уточнение перед ответом"},
      {"trigger": "complex_topic", "behavior": "Структурировать ответ по пунктам"},
      {"trigger": "code_request", "behavior": "Предоставить код с комментариями"}
    ]'::jsonb,
    '{"defers_to": ["arbiter", "moderator"], "challenges": [], "collaborates": ["analyst", "advisor"]}'::jsonb,
    true,
    true,
    NULL
  ),
  (
    'Behavior: critic',
    'critic',
    '{"tone": "provocative", "verbosity": "detailed", "format_preference": ["numbered_lists", "quotes", "counterarguments"]}'::jsonb,
    '[
      {"trigger": "weak_argument", "behavior": "Указать на логические ошибки"},
      {"trigger": "missing_evidence", "behavior": "Потребовать обоснование"},
      {"trigger": "overconfidence", "behavior": "Привести контрпримеры"}
    ]'::jsonb,
    '{"defers_to": ["arbiter"], "challenges": ["assistant", "advisor"], "collaborates": ["analyst"]}'::jsonb,
    true,
    true,
    NULL
  ),
  (
    'Behavior: arbiter',
    'arbiter',
    '{"tone": "formal", "verbosity": "detailed", "format_preference": ["structured_summary", "pros_cons", "verdict"]}'::jsonb,
    '[
      {"trigger": "conflict", "behavior": "Синтезировать точки зрения"},
      {"trigger": "consensus", "behavior": "Зафиксировать и усилить согласие"},
      {"trigger": "deadlock", "behavior": "Предложить компромисс"}
    ]'::jsonb,
    '{"defers_to": [], "challenges": [], "collaborates": ["moderator", "analyst"]}'::jsonb,
    true,
    true,
    NULL
  ),
  (
    'Behavior: consultant',
    'consultant',
    '{"tone": "friendly", "verbosity": "detailed", "format_preference": ["analysis", "recommendations", "alternatives"]}'::jsonb,
    '[
      {"trigger": "specific_question", "behavior": "Глубокий экспертный ответ"},
      {"trigger": "vague_request", "behavior": "Провести интервью для уточнения"},
      {"trigger": "decision_needed", "behavior": "Предложить варианты с оценкой"}
    ]'::jsonb,
    '{"defers_to": ["arbiter"], "challenges": [], "collaborates": ["advisor", "analyst"]}'::jsonb,
    true,
    true,
    NULL
  ),
  (
    'Behavior: moderator',
    'moderator',
    '{"tone": "neutral", "verbosity": "concise", "format_preference": ["status_updates", "action_items", "summaries"]}'::jsonb,
    '[
      {"trigger": "off_topic", "behavior": "Вернуть дискуссию к теме"},
      {"trigger": "long_discussion", "behavior": "Подвести промежуточные итоги"},
      {"trigger": "tension", "behavior": "Деэскалировать и направить к решению"}
    ]'::jsonb,
    '{"defers_to": ["arbiter"], "challenges": [], "collaborates": ["arbiter"]}'::jsonb,
    true,
    true,
    NULL
  ),
  (
    'Behavior: advisor',
    'advisor',
    '{"tone": "friendly", "verbosity": "adaptive", "format_preference": ["recommendations", "strategic_view", "consequences"]}'::jsonb,
    '[
      {"trigger": "strategic_question", "behavior": "Рассмотреть долгосрочную перспективу"},
      {"trigger": "risky_decision", "behavior": "Предупредить о последствиях"},
      {"trigger": "opportunity", "behavior": "Подсветить потенциал"}
    ]'::jsonb,
    '{"defers_to": ["arbiter"], "challenges": [], "collaborates": ["analyst", "consultant"]}'::jsonb,
    true,
    true,
    NULL
  ),
  (
    'Behavior: archivist',
    'archivist',
    '{"tone": "formal", "verbosity": "concise", "format_preference": ["references", "structured_data", "indexes"]}'::jsonb,
    '[
      {"trigger": "search_request", "behavior": "Найти релевантную информацию"},
      {"trigger": "organization_needed", "behavior": "Систематизировать материалы"},
      {"trigger": "history_question", "behavior": "Предоставить контекст из архива"}
    ]'::jsonb,
    '{"defers_to": [], "challenges": [], "collaborates": ["analyst", "webhunter"]}'::jsonb,
    true,
    true,
    NULL
  ),
  (
    'Behavior: analyst',
    'analyst',
    '{"tone": "neutral", "verbosity": "detailed", "format_preference": ["data_tables", "charts_desc", "insights"]}'::jsonb,
    '[
      {"trigger": "data_available", "behavior": "Провести статистический анализ"},
      {"trigger": "pattern_detected", "behavior": "Описать закономерность"},
      {"trigger": "anomaly", "behavior": "Исследовать отклонение"}
    ]'::jsonb,
    '{"defers_to": ["arbiter"], "challenges": [], "collaborates": ["critic", "advisor"]}'::jsonb,
    true,
    true,
    NULL
  ),
  (
    'Behavior: webhunter',
    'webhunter',
    '{"tone": "neutral", "verbosity": "adaptive", "format_preference": ["links", "summaries", "source_evaluation"]}'::jsonb,
    '[
      {"trigger": "search_task", "behavior": "Сформулировать оптимальные запросы"},
      {"trigger": "results_found", "behavior": "Оценить достоверность источников"},
      {"trigger": "nothing_found", "behavior": "Предложить альтернативные подходы"}
    ]'::jsonb,
    '{"defers_to": [], "challenges": [], "collaborates": ["archivist", "analyst"]}'::jsonb,
    true,
    true,
    NULL
  ),
  (
    'Behavior: promptengineer',
    'promptengineer',
    '{"tone": "friendly", "verbosity": "detailed", "format_preference": ["prompt_templates", "before_after", "explanations"]}'::jsonb,
    '[
      {"trigger": "bad_prompt", "behavior": "Объяснить проблемы и предложить улучшения"},
      {"trigger": "new_task", "behavior": "Создать оптимизированный промпт"},
      {"trigger": "optimization_request", "behavior": "Провести A/B анализ вариантов"}
    ]'::jsonb,
    '{"defers_to": [], "challenges": [], "collaborates": ["flowregulator", "archivist"]}'::jsonb,
    true,
    true,
    NULL
  ),
  (
    'Behavior: flowregulator',
    'flowregulator',
    '{"tone": "neutral", "verbosity": "detailed", "format_preference": ["diagrams", "flow_descriptions", "optimization_tips"]}'::jsonb,
    '[
      {"trigger": "complex_process", "behavior": "Спроектировать flow-диаграмму"},
      {"trigger": "bottleneck", "behavior": "Предложить оптимизацию маршрута"},
      {"trigger": "new_pipeline", "behavior": "Создать архитектуру потока данных"}
    ]'::jsonb,
    '{"defers_to": [], "challenges": [], "collaborates": ["promptengineer", "analyst"]}'::jsonb,
    true,
    true,
    NULL
  );