import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Consultant feature translations will be added below

type Language = 'ru' | 'en';

interface Translations {
  [key: string]: {
    ru: string;
    en: string;
  };
}

const translations: Translations = {
  // Navigation
  'nav.home': { ru: 'Главная', en: 'Home' },
  'nav.expertPanel': { ru: 'Панель экспертов', en: 'Expert Panel' },
  'nav.tasks': { ru: 'Задачи', en: 'Tasks' },
  'nav.roleLibrary': { ru: 'Библиотека промптов', en: 'Prompt Library' },
  'nav.toolsLibrary': { ru: 'Инструменты', en: 'Tools' },
  'nav.flowEditor': { ru: 'Редактор потоков мысли', en: 'Thought Flow Editor' },
  'nav.profile': { ru: 'Профиль', en: 'Profile' },
  'nav.settings': { ru: 'Настройки', en: 'Settings' },
  'nav.logout': { ru: 'Выйти', en: 'Logout' },
  'nav.login': { ru: 'Войти', en: 'Login' },
  'nav.signup': { ru: 'Регистрация', en: 'Sign Up' },
  'nav.admin': { ru: 'Админ-панель', en: 'Admin Panel' },
  'nav.warRoom': { ru: 'Экспертный Совет', en: 'Expert Council' },
  'nav.modelRatings': { ru: 'Рейтинг моделей', en: 'Model Ratings' },
  'nav.hydrapedia': { ru: 'Гидропедия', en: 'Hydrapedia' },
  
  // Hydrapedia
  'hydrapedia.title': { ru: 'Гидропедия', en: 'Hydrapedia' },
  'hydrapedia.subtitle': { ru: 'Руководство пользователя AI-Hydra', en: 'AI-Hydra User Guide' },
  'hydrapedia.sections.intro': { ru: 'Введение', en: 'Introduction' },
  'hydrapedia.sections.gettingStarted': { ru: 'Начало работы', en: 'Getting Started' },
  'hydrapedia.sections.expertPanel': { ru: 'Панель экспертов', en: 'Expert Panel' },
  'hydrapedia.sections.roles': { ru: 'Роли агентов', en: 'Agent Roles' },
  'hydrapedia.sections.promptLibrary': { ru: 'Библиотека промптов', en: 'Prompt Library' },
  'hydrapedia.sections.tools': { ru: 'Инструменты', en: 'Tools' },
  'hydrapedia.sections.flowEditor': { ru: 'Редактор потоков', en: 'Flow Editor' },
  'hydrapedia.sections.modelRatings': { ru: 'Рейтинг моделей', en: 'Model Ratings' },
  'hydrapedia.sections.bestPractices': { ru: 'Лучшие практики', en: 'Best Practices' },
  
  // Mermaid
  'mermaid.error': { ru: 'Ошибка рендеринга диаграммы', en: 'Diagram render error' },
  'mermaid.copy': { ru: 'Копировать код', en: 'Copy code' },
  
  // Flow Editor
  'flowEditor.title': { ru: 'Редактор Data-Flow', en: 'Data-Flow Editor' },
  'flowEditor.description': { ru: 'Визуальное проектирование логики AI-промптов и цепочек обработки', en: 'Visual design for AI prompt logic and processing chains' },
  'flowEditor.newDiagram': { ru: 'Новая диаграмма', en: 'New Diagram' },
  'flowEditor.save': { ru: 'Сохранить', en: 'Save' },
  'flowEditor.export': { ru: 'Экспорт', en: 'Export' },
  'flowEditor.exportPng': { ru: 'Экспорт в PNG', en: 'Export as PNG' },
  'flowEditor.exportSvg': { ru: 'Экспорт в SVG', en: 'Export as SVG' },
  'flowEditor.exportJson': { ru: 'Экспорт в JSON', en: 'Export as JSON' },
  'flowEditor.generateMermaid': { ru: 'Сгенерировать Mermaid', en: 'Generate Mermaid' },
  'flowEditor.autoLayout': { ru: 'Авто-раскладка', en: 'Auto Layout' },
  'flowEditor.layoutHorizontal': { ru: 'Горизонтальная', en: 'Horizontal' },
  'flowEditor.layoutVertical': { ru: 'Вертикальная', en: 'Vertical' },
  'flowEditor.nodes.input': { ru: 'Вход', en: 'Input' },
  'flowEditor.nodes.prompt': { ru: 'Промпт', en: 'Prompt' },
  'flowEditor.nodes.model': { ru: 'AI Модель', en: 'AI Model' },
  'flowEditor.nodes.condition': { ru: 'Условие', en: 'Condition' },
  'flowEditor.nodes.tool': { ru: 'Инструмент', en: 'Tool' },
  'flowEditor.nodes.output': { ru: 'Выход', en: 'Output' },
  // New node types
  'flowEditor.nodes.transform': { ru: 'Трансформация', en: 'Transform' },
  'flowEditor.nodes.filter': { ru: 'Фильтр', en: 'Filter' },
  'flowEditor.nodes.merge': { ru: 'Слияние', en: 'Merge' },
  'flowEditor.nodes.split': { ru: 'Разделение', en: 'Split' },
  'flowEditor.nodes.database': { ru: 'База данных', en: 'Database' },
  'flowEditor.nodes.api': { ru: 'API', en: 'API' },
  'flowEditor.nodes.storage': { ru: 'Хранилище', en: 'Storage' },
  'flowEditor.nodes.loop': { ru: 'Цикл', en: 'Loop' },
  'flowEditor.nodes.delay': { ru: 'Задержка', en: 'Delay' },
  'flowEditor.nodes.switch': { ru: 'Переключатель', en: 'Switch' },
  'flowEditor.nodes.embedding': { ru: 'Эмбеддинг', en: 'Embedding' },
  'flowEditor.nodes.memory': { ru: 'Память', en: 'Memory' },
  'flowEditor.nodes.classifier': { ru: 'Классификатор', en: 'Classifier' },
  'flowEditor.sidebar.elements': { ru: 'Элементы', en: 'Elements' },
  'flowEditor.sidebar.dragHint': { ru: 'Перетащите на холст', en: 'Drag to canvas' },
  'flowEditor.empty': { ru: 'Перетащите элементы на холст для создания диаграммы', en: 'Drag elements to canvas to create a diagram' },
  'flowEditor.saved': { ru: 'Диаграмма сохранена', en: 'Diagram saved' },
  'flowEditor.deleted': { ru: 'Диаграмма удалена', en: 'Diagram deleted' },
  
  // Flow Editor - Node Properties Panel
  'flowEditor.properties.title': { ru: 'Свойства узла', en: 'Node Properties' },
  'flowEditor.properties.label': { ru: 'Название', en: 'Label' },
  'flowEditor.properties.description': { ru: 'Описание', en: 'Description' },
  'flowEditor.properties.inputType': { ru: 'Тип входных данных', en: 'Input Type' },
  'flowEditor.properties.inputDescPlaceholder': { ru: 'Опишите входные данные...', en: 'Describe the input data...' },
  'flowEditor.properties.outputType': { ru: 'Тип выходных данных', en: 'Output Type' },
  'flowEditor.properties.outputDescPlaceholder': { ru: 'Опишите выходные данные...', en: 'Describe the output data...' },
  'flowEditor.properties.promptContent': { ru: 'Содержание промпта', en: 'Prompt Content' },
  'flowEditor.properties.promptPlaceholder': { ru: 'Введите системный промпт...', en: 'Enter system prompt...' },
  'flowEditor.properties.modelName': { ru: 'Модель', en: 'Model' },
  'flowEditor.properties.temperature': { ru: 'Температура', en: 'Temperature' },
  'flowEditor.properties.maxTokens': { ru: 'Макс. токенов', en: 'Max Tokens' },
  'flowEditor.properties.condition': { ru: 'Условие', en: 'Condition' },
  'flowEditor.properties.conditionPlaceholder': { ru: 'Введите условие ветвления...', en: 'Enter branching condition...' },
  'flowEditor.properties.trueLabel': { ru: 'Если да', en: 'If true' },
  'flowEditor.properties.falseLabel': { ru: 'Если нет', en: 'If false' },
  'flowEditor.properties.yes': { ru: 'Да', en: 'Yes' },
  'flowEditor.properties.no': { ru: 'Нет', en: 'No' },
  'flowEditor.properties.toolName': { ru: 'Название инструмента', en: 'Tool Name' },
  'flowEditor.properties.toolNamePlaceholder': { ru: 'Выберите или введите инструмент...', en: 'Select or enter tool...' },
  'flowEditor.properties.toolConfig': { ru: 'Конфигурация (JSON)', en: 'Configuration (JSON)' },
  'flowEditor.properties.deleteNode': { ru: 'Удалить узел', en: 'Delete Node' },
  'flowEditor.properties.selectFromLibrary': { ru: 'Выбрать из библиотеки', en: 'Select from Library' },
  'flowEditor.properties.noPromptSelected': { ru: 'Не выбран', en: 'Not selected' },
  'flowEditor.properties.loadingPrompts': { ru: 'Загрузка промптов...', en: 'Loading prompts...' },
  'flowEditor.properties.noPromptsAvailable': { ru: 'Нет доступных промптов', en: 'No prompts available' },
  'flowEditor.properties.orWriteCustom': { ru: 'или напишите свой:', en: 'or write custom:' },
  'flowEditor.properties.selectFromToolLibrary': { ru: 'Выбрать из библиотеки инструментов', en: 'Select from tool library' },
  'flowEditor.properties.loadingTools': { ru: 'Загрузка инструментов...', en: 'Loading tools...' },
  'flowEditor.properties.noToolsAvailable': { ru: 'Нет доступных инструментов', en: 'No tools available' },
  'flowEditor.properties.noToolSelected': { ru: 'Выберите инструмент', en: 'Select a tool' },
  'flowEditor.properties.orConfigureManually': { ru: 'или настройте вручную', en: 'or configure manually' },
  
  // Transform node properties
  'flowEditor.properties.transformType': { ru: 'Тип трансформации', en: 'Transform Type' },
  'flowEditor.properties.selectTransformType': { ru: 'Выберите тип', en: 'Select type' },
  'flowEditor.properties.text': { ru: 'Текст', en: 'Text' },
  'flowEditor.properties.format': { ru: 'Форматирование', en: 'Format' },
  'flowEditor.properties.transformExpression': { ru: 'Выражение', en: 'Expression' },
  'flowEditor.properties.transformExpressionPlaceholder': { ru: '$.data.items | map(...)...', en: '$.data.items | map(...)...' },
  
  // Filter node properties
  'flowEditor.properties.filterCondition': { ru: 'Условие фильтрации', en: 'Filter Condition' },
  'flowEditor.properties.filterConditionPlaceholder': { ru: 'item.status === "active"', en: 'item.status === "active"' },
  
  // Merge node properties
  'flowEditor.properties.mergeStrategy': { ru: 'Стратегия слияния', en: 'Merge Strategy' },
  'flowEditor.properties.selectMergeStrategy': { ru: 'Выберите стратегию', en: 'Select strategy' },
  'flowEditor.properties.mergeConcat': { ru: 'Конкатенация', en: 'Concatenate' },
  'flowEditor.properties.mergeObject': { ru: 'Объединение объектов', en: 'Merge objects' },
  'flowEditor.properties.mergeArray': { ru: 'Массив', en: 'Array' },
  
  // Split node properties
  'flowEditor.properties.splitKey': { ru: 'Ключ разделения', en: 'Split Key' },
  'flowEditor.properties.splitKeyPlaceholder': { ru: 'data.items', en: 'data.items' },
  
  // Database node properties
  'flowEditor.properties.dbOperation': { ru: 'Операция', en: 'Operation' },
  'flowEditor.properties.selectDbOperation': { ru: 'Выберите операцию', en: 'Select operation' },
  'flowEditor.properties.dbRead': { ru: 'Чтение', en: 'Read' },
  'flowEditor.properties.dbWrite': { ru: 'Запись', en: 'Write' },
  'flowEditor.properties.dbUpdate': { ru: 'Обновление', en: 'Update' },
  'flowEditor.properties.dbDelete': { ru: 'Удаление', en: 'Delete' },
  'flowEditor.properties.tableName': { ru: 'Таблица', en: 'Table' },
  'flowEditor.properties.tableNamePlaceholder': { ru: 'users, messages...', en: 'users, messages...' },
  
  // API node properties
  'flowEditor.properties.apiMethod': { ru: 'HTTP метод', en: 'HTTP Method' },
  'flowEditor.properties.selectApiMethod': { ru: 'Выберите метод', en: 'Select method' },
  'flowEditor.properties.apiUrl': { ru: 'URL', en: 'URL' },
  
  // Storage node properties
  'flowEditor.properties.storageOperation': { ru: 'Операция', en: 'Operation' },
  'flowEditor.properties.selectStorageOperation': { ru: 'Выберите операцию', en: 'Select operation' },
  'flowEditor.properties.storageRead': { ru: 'Чтение', en: 'Read' },
  'flowEditor.properties.storageWrite': { ru: 'Запись', en: 'Write' },
  'flowEditor.properties.storagePath': { ru: 'Путь к файлу', en: 'File Path' },
  
  // Loop node properties
  'flowEditor.properties.loopVariable': { ru: 'Переменная итерации', en: 'Loop Variable' },
  'flowEditor.properties.loopVariablePlaceholder': { ru: 'item, index', en: 'item, index' },
  'flowEditor.properties.maxIterations': { ru: 'Макс. итераций', en: 'Max Iterations' },
  
  // Delay node properties
  'flowEditor.properties.delayMs': { ru: 'Задержка (мс)', en: 'Delay (ms)' },
  'flowEditor.properties.delayMsHint': { ru: '1000 мс = 1 секунда', en: '1000 ms = 1 second' },
  
  // Switch node properties
  'flowEditor.properties.switchCases': { ru: 'Варианты (JSON)', en: 'Cases (JSON)' },
  'flowEditor.properties.switchCasesHint': { ru: 'Массив объектов с label и condition', en: 'Array of objects with label and condition' },
  
  // Embedding node properties
  'flowEditor.properties.embeddingModel': { ru: 'Модель эмбеддинга', en: 'Embedding Model' },
  'flowEditor.properties.selectEmbeddingModel': { ru: 'Выберите модель', en: 'Select model' },
  
  // Memory node properties
  'flowEditor.properties.memoryType': { ru: 'Тип памяти', en: 'Memory Type' },
  'flowEditor.properties.selectMemoryType': { ru: 'Выберите тип', en: 'Select type' },
  'flowEditor.properties.memoryShort': { ru: 'Краткосрочная', en: 'Short-term' },
  'flowEditor.properties.memoryLong': { ru: 'Долгосрочная', en: 'Long-term' },
  'flowEditor.properties.memoryRag': { ru: 'RAG (поиск)', en: 'RAG (retrieval)' },
  
  // Classifier node properties
  'flowEditor.properties.classifierLabels': { ru: 'Метки классификации', en: 'Classification Labels' },
  'flowEditor.properties.classifierLabelsPlaceholder': { ru: 'positive\nnegative\nneutral', en: 'positive\nnegative\nneutral' },
  'flowEditor.properties.classifierLabelsHint': { ru: 'По одной метке на строку', en: 'One label per line' },
  
  // Auth
  'auth.email': { ru: 'Email', en: 'Email' },
  'auth.password': { ru: 'Пароль', en: 'Password' },
  'auth.confirmPassword': { ru: 'Подтвердите пароль', en: 'Confirm Password' },
  'auth.loginTitle': { ru: 'Вход в AI-Hydra', en: 'Login to AI-Hydra' },
  'auth.signupTitle': { ru: 'Создать аккаунт', en: 'Create Account' },
  'auth.loginButton': { ru: 'Войти', en: 'Sign In' },
  'auth.signupButton': { ru: 'Зарегистрироваться', en: 'Sign Up' },
  'auth.noAccount': { ru: 'Нет аккаунта?', en: "Don't have an account?" },
  'auth.hasAccount': { ru: 'Уже есть аккаунт?', en: 'Already have an account?' },
  'auth.displayName': { ru: 'Отображаемое имя', en: 'Display Name' },
  
  // Profile
  'profile.title': { ru: 'Личный кабинет', en: 'Profile' },
  'profile.apiKeys': { ru: 'API Ключи', en: 'API Keys' },
  'profile.openai': { ru: 'OpenAI API Key', en: 'OpenAI API Key' },
  'profile.gemini': { ru: 'Google Gemini API Key', en: 'Google Gemini API Key' },
  'profile.anthropic': { ru: 'Anthropic API Key', en: 'Anthropic API Key' },
  'profile.save': { ru: 'Сохранить', en: 'Save' },
  'profile.saved': { ru: 'Сохранено!', en: 'Saved!' },
  'profile.preferences': { ru: 'Настройки', en: 'Preferences' },
  'profile.theme': { ru: 'Тема оформления', en: 'Theme' },
  'profile.language': { ru: 'Язык интерфейса', en: 'Interface Language' },
  'profile.themeDark': { ru: 'Тёмная', en: 'Dark' },
  'profile.themeLight': { ru: 'Светлая', en: 'Light' },
  'profile.stats': { ru: 'Статистика', en: 'Statistics' },
  'profile.statsTitle': { ru: 'Использование токенов', en: 'Token Usage' },
  'profile.totalTokens': { ru: 'Всего токенов', en: 'Total Tokens' },
  'profile.inputTokens': { ru: 'Входных токенов', en: 'Input Tokens' },
  'profile.outputTokens': { ru: 'Выходных токенов', en: 'Output Tokens' },
  'profile.estimatedCost': { ru: 'Примерная стоимость', en: 'Estimated Cost' },
  'profile.byModel': { ru: 'По моделям', en: 'By Model' },
  'profile.noUsageData': { ru: 'Нет данных об использовании. Начните использовать модели!', en: 'No usage data. Start using models!' },
  'profile.requestCount': { ru: 'Запросов', en: 'Requests' },
  
  // Home / Hero
  'hero.title': { ru: 'AI-Hydra', en: 'AI-Hydra' },
  'hero.subtitle': { ru: 'Мультиагентная платформа синергии', en: 'Multi-Agent Synergy Platform' },
  'hero.description': { ru: 'Ансамбль LLM моделей для решения сверхсложных задач', en: 'LLM ensemble for solving ultra-complex problems' },
  'hero.getStarted': { ru: 'Начать работу', en: 'Get Started' },
  'hero.learnMore': { ru: 'Подробнее', en: 'Learn More' },
  
  // Expert Panel
  'expertPanel.title': { ru: 'Панель экспертов', en: 'Expert Panel' },
  'expertPanel.mainStage': { ru: 'Ответ Арбитра', en: 'Arbiter Response' },
  'expertPanel.experts': { ru: 'Эксперты', en: 'Experts' },
  'expertPanel.critic': { ru: 'Критик', en: 'Critic' },
  'expertPanel.sendPrompt': { ru: 'Отправить запрос', en: 'Send Prompt' },
  'expertPanel.placeholder': { ru: 'Введите ваш запрос...', en: 'Enter your prompt...' },
  'expertPanel.noSession': { ru: 'Выберите или создайте задачу', en: 'Select or create a task' },
  'expertPanel.noApiKeys': { ru: 'Нет доступных моделей. Добавьте API ключи в профиле.', en: 'No models available. Add API keys in profile.' },
  'expertPanel.selectModel': { ru: 'Выберите модель', en: 'Select model' },
  'expertPanel.selectModels': { ru: 'Выберите модели', en: 'Select models' },
  'expertPanel.modelsSelected': { ru: 'Выбрано: {count}', en: '{count} selected' },
  'expertPanel.personalKeys': { ru: 'Персональные ключи', en: 'Personal Keys' },
  
  // Model selection (Tasks page)
  'models.noApiKeys': { ru: 'Нет доступных моделей. Добавьте API ключи в профиле.', en: 'No models available. Add API keys in profile.' },
  'models.selectModel': { ru: 'Выберите модель', en: 'Select model' },
  'models.modelsSelected': { ru: 'Выбрано: {count}', en: '{count} selected' },
  'models.personalKeys': { ru: 'Персональные ключи', en: 'Personal Keys' },
  'models.noModelsSelected': { ru: 'Модели не выбраны', en: 'No models selected' },
  'models.resetCache': { ru: 'Сбросить кэш недоступных', en: 'Reset unavailable cache' },
  
  // Tasks (formerly Sessions)
  'tasks.title': { ru: 'Задачи', en: 'Tasks' },
  'tasks.new': { ru: 'Новая задача', en: 'New Task' },
  'tasks.empty': { ru: 'Нет активных задач', en: 'No active tasks' },
  'tasks.delete': { ru: 'Удалить', en: 'Delete' },
  'tasks.search': { ru: 'Поиск задач...', en: 'Search tasks...' },
  'tasks.noResults': { ru: 'Задачи не найдены', en: 'No tasks found' },
  'tasks.deleteConfirmTitle': { ru: 'Удалить задачу?', en: 'Delete task?' },
  'tasks.deleteConfirmDescription': { ru: 'Это действие нельзя отменить. Задача и все связанные сообщения будут удалены навсегда.', en: 'This action cannot be undone. The task and all related messages will be permanently deleted.' },
  'tasks.modelConfig': { ru: 'Настройки моделей', en: 'Model Settings' },
  'tasks.selectModelsFirst': { ru: 'Сначала выберите модели', en: 'Select models first' },
  'tasks.modelSelector': { ru: 'Выбор моделей', en: 'Model Selection' },
  'tasks.editTitle': { ru: 'Редактировать название', en: 'Edit title' },
  'tasks.titleSaved': { ru: 'Название сохранено', en: 'Title saved' },
  'tasks.configSaved': { ru: 'Настройки сохранены', en: 'Settings saved' },
  
  // Models
  'model.gemini': { ru: 'Gemini Pro', en: 'Gemini Pro' },
  'model.gpt': { ru: 'GPT-4', en: 'GPT-4' },
  'model.claude': { ru: 'Claude', en: 'Claude' },
  'model.grok': { ru: 'Grok', en: 'Grok' },
  
  // Roles
  'role.user': { ru: 'Пользователь', en: 'User' },
  'role.supervisor': { ru: 'Супервизор', en: 'Supervisor' },
  'role.assistant': { ru: 'Эксперт', en: 'Expert' },
  'role.critic': { ru: 'Критик', en: 'Critic' },
  'role.arbiter': { ru: 'Арбитр', en: 'Arbiter' },
  'role.consultant': { ru: 'Консультант', en: 'Consultant' },
  'role.moderator': { ru: 'Модератор', en: 'Moderator' },
  'role.advisor': { ru: 'Советник', en: 'Advisor' },
  'role.archivist': { ru: 'Архивариус', en: 'Archivist' },
  'role.analyst': { ru: 'Аналитик', en: 'Analyst' },
  'role.webhunter': { ru: 'Web-Охотник', en: 'Web Hunter' },
  
  // Consultant feature
  'consultant.select': { ru: 'Консультант', en: 'Consultant' },
  'consultant.selectModel': { ru: 'Выберите модель консультанта', en: 'Select consultant model' },
  'consultant.askOnly': { ru: 'Спросить', en: 'Ask' },
  'consultant.onlyRequest': { ru: 'Запрос только консультанту', en: 'Consultant-only request' },
  
  // Common
  'common.loading': { ru: 'Загрузка...', en: 'Loading...' },
  'common.error': { ru: 'Ошибка', en: 'Error' },
  'common.success': { ru: 'Успешно', en: 'Success' },
  'common.cancel': { ru: 'Отмена', en: 'Cancel' },
  'common.confirm': { ru: 'Подтвердить', en: 'Confirm' },
  'common.addLanguage': { ru: 'Добавить язык...', en: 'Add language...' },
  'common.selectAll': { ru: 'Выбрать все', en: 'Select all' },
  'common.deselectAll': { ru: 'Снять все', en: 'Deselect all' },
  'common.delete': { ru: 'Удалить', en: 'Delete' },
  'common.collapse': { ru: 'Свернуть', en: 'Collapse' },
  'common.expand': { ru: 'Развернуть', en: 'Expand' },
  
  // Messages
  'messages.deleteTitle': { ru: 'Удалить сообщение?', en: 'Delete message?' },
  'messages.deleteConfirm': { ru: 'Это действие нельзя отменить. Сообщение будет удалено навсегда.', en: 'This action cannot be undone. The message will be permanently deleted.' },
  'messages.rating': { ru: 'Рейтинг', en: 'Rating' },
  'messages.deleted': { ru: 'Сообщение удалено', en: 'Message deleted' },
  'messages.groupDeleted': { ru: 'Сообщения удалены', en: 'Messages deleted' },
  'messages.deleteGroupTitle': { ru: 'Удалить запрос и ответы?', en: 'Delete query and responses?' },
  'messages.deleteGroupConfirm': { ru: 'Будут удалены запрос пользователя и все ответы AI ({count} сообщений).', en: 'User query and all AI responses will be deleted ({count} messages).' },
  
  // Files
  'files.attach': { ru: 'Прикрепить файл', en: 'Attach file' },
  'files.remove': { ru: 'Удалить', en: 'Remove' },
  'files.maxSize': { ru: 'Максимальный размер: {size}MB', en: 'Max size: {size}MB' },
  'files.maxFiles': { ru: 'Максимум файлов: {count}', en: 'Max files: {count}' },
  'files.tooLarge': { ru: 'Файл слишком большой', en: 'File too large' },
  'files.tooMany': { ru: 'Слишком много файлов', en: 'Too many files' },
  'files.uploading': { ru: 'Загрузка файлов...', en: 'Uploading files...' },
  'files.download': { ru: 'Скачать', en: 'Download' },
  'files.invalidType': { ru: 'Неподдерживаемый тип файла', en: 'Unsupported file type' },
  'files.uploadError': { ru: 'Ошибка загрузки', en: 'Upload error' },
  
  // Stats
  'stats.modelRatings': { ru: 'Рейтинг моделей', en: 'Model Ratings' },
  'stats.totalBrains': { ru: 'Всего мозгов', en: 'Total brains' },
  'stats.avgRating': { ru: 'Средний балл', en: 'Average rating' },
  'stats.responseCount': { ru: 'Количество ответов', en: 'Response count' },
  
  // Ratings page
  'ratings.title': { ru: 'Рейтинг моделей', en: 'Model Ratings' },
  'ratings.empty': { ru: 'Пока нет данных о рейтингах. Начните оценивать ответы моделей!', en: 'No rating data yet. Start rating model responses!' },
  'ratings.overall': { ru: 'Общий', en: 'Overall' },
  'ratings.allModels': { ru: 'Все модели', en: 'All Models' },
  'ratings.noDataForRole': { ru: 'Нет данных для этой роли', en: 'No data for this role' },
  
  // Settings
  'settings.modelSettings': { ru: 'Настройки модели', en: 'Model Settings' },
  'settings.role': { ru: 'Роль агента', en: 'Agent Role' },
  'settings.temperature': { ru: 'Температура', en: 'Temperature' },
  'settings.maxTokens': { ru: 'Макс. токенов', en: 'Max Tokens' },
  'settings.systemPrompt': { ru: 'Системный промпт', en: 'System Prompt' },
  'settings.systemPromptPlaceholder': { ru: 'Введите инструкции для модели...', en: 'Enter instructions for the model...' },
  'settings.resetDefaults': { ru: 'Сбросить настройки', en: 'Reset to Defaults' },
  'settings.reset': { ru: 'Сбросить', en: 'Reset' },
  'settings.copyToAll': { ru: 'Копировать на все', en: 'Copy to All' },
  'settings.copiedToAll': { ru: 'Настройки скопированы', en: 'Settings copied' },
  'settings.precise': { ru: 'Точность', en: 'Precise' },
  'settings.creative': { ru: 'Креатив', en: 'Creative' },
  'settings.pricing': { ru: 'Стоимость', en: 'Pricing' },
  'settings.inputCost': { ru: 'Ввод', en: 'Input' },
  'settings.outputCost': { ru: 'Вывод', en: 'Output' },
  'settings.perMillion': { ru: 'за 1M токенов', en: 'per 1M tokens' },
  'settings.noPricing': { ru: 'Цена не указана', en: 'Pricing not available' },
  'settings.estimatedCost': { ru: 'Прогноз стоимости', en: 'Estimated Cost' },
  'settings.inputTokens': { ru: 'Токенов ввода', en: 'Input tokens' },
  'settings.outputTokens': { ru: 'Токенов вывода', en: 'Output tokens' },
  'settings.totalCost': { ru: 'Итого', en: 'Total' },
  'settings.enterMessage': { ru: 'Введите сообщение для расчёта', en: 'Enter message to calculate' },
  'settings.rolePrompt': { ru: 'Ролевой промпт', en: 'Role Prompt' },
  'settings.editPrompt': { ru: 'Редактировать', en: 'Edit' },
  'settings.revertPrompt': { ru: 'Вернуть', en: 'Revert' },
  'settings.savePrompt': { ru: 'Сохранить в библиотеку', en: 'Save to Library' },
  'settings.promptEditing': { ru: 'Редактирование', en: 'Editing' },
  'settings.promptSaved': { ru: 'Промпт сохранён в библиотеку', en: 'Prompt saved to library' },
  'settings.promptReverted': { ru: 'Промпт восстановлен', en: 'Prompt reverted' },
  'settings.promptName': { ru: 'Название промпта', en: 'Prompt name' },
  'settings.promptNamePlaceholder': { ru: 'Мой промпт...', en: 'My prompt...' },
  'settings.loadFromLibrary': { ru: 'Из библиотеки', en: 'From Library' },
  'settings.copyPrompt': { ru: 'Копировать', en: 'Copy' },
  'settings.clearPrompt': { ru: 'Очистить', en: 'Clear' },
  'settings.pastePrompt': { ru: 'Вставить', en: 'Paste' },
  'settings.promptCopied': { ru: 'Промпт скопирован', en: 'Prompt copied' },
  'settings.promptCleared': { ru: 'Промпт очищен', en: 'Prompt cleared' },
  'settings.promptPasted': { ru: 'Промпт вставлен', en: 'Prompt pasted' },
  'settings.promptTokens': { ru: 'токенов', en: 'tokens' },
  'settings.promptCost': { ru: 'стоимость', en: 'cost' },
  'settings.enableTools': { ru: 'Инструменты', en: 'Tools' },
  'settings.enableToolsDesc': { ru: 'Калькулятор, дата и время', en: 'Calculator, date and time' },

  // Prompt Library
  'promptLibrary.title': { ru: 'Библиотека промптов', en: 'Prompt Library' },
  'promptLibrary.searchPlaceholder': { ru: 'Поиск промптов...', en: 'Search prompts...' },
  'promptLibrary.allRoles': { ru: 'Все роли', en: 'All roles' },
  'promptLibrary.empty': { ru: 'Библиотека пуста. Сохраните первый промпт!', en: 'Library is empty. Save your first prompt!' },
  'promptLibrary.noResults': { ru: 'Промпты не найдены', en: 'No prompts found' },
  'promptLibrary.applied': { ru: 'Промпт применён', en: 'Prompt applied' },
  'promptLibrary.deleted': { ru: 'Промпт удалён', en: 'Prompt deleted' },
  'promptLibrary.shared': { ru: 'Публичный', en: 'Shared' },
  'promptLibrary.own': { ru: 'Ваш промпт', en: 'Your prompt' },
  'promptLibrary.usedTimes': { ru: 'Использован: {count}', en: 'Used: {count}' },
  
  // Expert Panel extras (legacy)
  'expertPanel.noModelsSelected': { ru: 'Модели не выбраны', en: 'No models selected' },
  
  // Presets
  'presets.title': { ru: 'Пресеты', en: 'Presets' },
  'presets.save': { ru: 'Сохранить как пресет', en: 'Save as Preset' },
  'presets.saveTitle': { ru: 'Сохранить пресет', en: 'Save Preset' },
  'presets.name': { ru: 'Название пресета', en: 'Preset Name' },
  'presets.namePlaceholder': { ru: 'Мой пресет...', en: 'My preset...' },
  'presets.saved': { ru: 'Пресет сохранён', en: 'Preset saved' },
  'presets.deleted': { ru: 'Пресет удалён', en: 'Preset deleted' },
  'presets.applied': { ru: 'Пресет применён', en: 'Preset applied' },
  'presets.empty': { ru: 'Нет сохранённых пресетов', en: 'No saved presets' },
  'presets.deleteConfirm': { ru: 'Удалить пресет?', en: 'Delete preset?' },
  
  // Thinking block
  'thinking.title': { ru: 'Процесс размышления', en: 'Thinking Process' },
  'thinking.translate': { ru: 'Перевести', en: 'Translate' },
  'thinking.translating': { ru: 'Перевод...', en: 'Translating...' },
  'thinking.translated': { ru: 'Переведено', en: 'Translated' },
  'thinking.translateError': { ru: 'Не удалось перевести', en: 'Translation failed' },
  'thinking.translateEmpty': { ru: 'Перевод вернул пустой результат', en: 'Translation returned empty result' },
  'thinking.showOriginal': { ru: 'Показать оригинал', en: 'Show original' },
  'thinking.showTranslated': { ru: 'Показать перевод', en: 'Show translation' },
  'thinking.hasSaved': { ru: 'Перевод сохранён', en: 'Translation saved' },

  // Chat TreeNav
  'chat.participants': { ru: 'Участники', en: 'Participants' },
  'chat.messagesCount': { ru: 'Сообщений', en: 'Messages' },
  'chat.scrollTo': { ru: 'Перейти к сообщениям', en: 'Scroll to messages' },
  'chat.noParticipants': { ru: 'Нет участников', en: 'No participants' },
  'chat.collapseAll': { ru: 'Свернуть всё', en: 'Collapse All' },
  'chat.expandAll': { ru: 'Развернуть всё', en: 'Expand All' },
  'chat.filtered': { ru: 'Фильтр активен', en: 'Filter active' },
  'chat.clearFilter': { ru: 'Сбросить фильтр', en: 'Clear filter' },

  // D-Chat (Consultant Panel)
  'dchat.title': { ru: 'D-Чат', en: 'D-Chat' },
  'dchat.webSearch': { ru: 'Веб-поиск', en: 'Web Search' },
  'dchat.expert': { ru: 'Специалист', en: 'Expert' },
  'dchat.critic': { ru: 'Критик', en: 'Critic' },
  'dchat.arbiter': { ru: 'Арбитр', en: 'Arbiter' },
  'dchat.selectModel': { ru: 'Выберите модель', en: 'Select model' },
  'dchat.placeholder': { ru: 'Введите запрос...', en: 'Enter query...' },
  'dchat.empty': { ru: 'Задайте вопрос консультанту', en: 'Ask the consultant a question' },
  'dchat.clear': { ru: 'Очистить историю', en: 'Clear history' },
  'dchat.sendToConsultant': { ru: 'Спросить в D-чате', en: 'Ask in D-Chat' },
  'dchat.copyToChat': { ru: 'Копировать в чат', en: 'Copy to chat' },
  'dchat.collapse': { ru: 'Свернуть', en: 'Collapse' },
  'dchat.expand': { ru: 'Развернуть', en: 'Expand' },
  'dchat.contextFrom': { ru: 'Контекст: Сообщение #{index}', en: 'Context: Message #{index}' },
  'dchat.copiedToChat': { ru: 'Скопировано в чат', en: 'Copied to chat' },
  'dchat.moderator': { ru: 'Модератор', en: 'Moderator' },
  'dchat.moderating': { ru: 'Модератор анализирует...', en: 'Moderator analyzing...' },
  'dchat.contextAggregated': { ru: 'Анализ {count} ответов', en: 'Analyzing {count} responses' },
  'dchat.clarifyWithSpecialist': { ru: 'Уточнить у Специалиста', en: 'Clarify with Specialist' },

  // Role Library
  'roleLibrary.title': { ru: 'Библиотека промптов', en: 'Prompt Library' },
  'roleLibrary.pageDescription': { ru: 'Создавайте и управляйте системными промптами для ИИ-ролей. Сохранённые промпты можно использовать в настройках моделей на панели экспертов.', en: 'Create and manage system prompts for AI roles. Saved prompts can be used in model settings on the Expert Panel.' },
  'roleLibrary.new': { ru: 'Новый промпт', en: 'New Prompt' },
  'roleLibrary.empty': { ru: 'Библиотека пуста', en: 'Library is empty' },
  'roleLibrary.name': { ru: 'Название', en: 'Name' },
  'roleLibrary.namePlaceholder': { ru: 'Название промпта...', en: 'Prompt name...' },
  'roleLibrary.description': { ru: 'Описание', en: 'Description' },
  'roleLibrary.descriptionPlaceholder': { ru: 'Краткое описание...', en: 'Brief description...' },
  'roleLibrary.content': { ru: 'Системный промпт', en: 'System Prompt' },
  'roleLibrary.contentPlaceholder': { ru: 'Инструкции для ИИ...', en: 'Instructions for AI...' },
  'roleLibrary.role': { ru: 'Роль', en: 'Role' },
  'roleLibrary.isShared': { ru: 'Публичный', en: 'Public' },
  'roleLibrary.create': { ru: 'Создать', en: 'Create' },
  'roleLibrary.edit': { ru: 'Редактировать промпт', en: 'Edit Prompt' },
  'roleLibrary.created': { ru: 'Промпт создан', en: 'Prompt created' },
  'roleLibrary.updated': { ru: 'Промпт обновлён', en: 'Prompt updated' },
  'roleLibrary.deleted': { ru: 'Промпт удалён', en: 'Prompt deleted' },
  'roleLibrary.deleteConfirmTitle': { ru: 'Удалить промпт?', en: 'Delete prompt?' },
  'roleLibrary.deleteConfirmDescription': { ru: 'Это действие нельзя отменить.', en: 'This action cannot be undone.' },
  'roleLibrary.search': { ru: 'Поиск...', en: 'Search...' },
  'roleLibrary.filterAll': { ru: 'Все', en: 'All' },
  'roleLibrary.filterOwn': { ru: 'Мои', en: 'My own' },
  'roleLibrary.filterShared': { ru: 'Публичные', en: 'Public' },
  'roleLibrary.usedCount': { ru: 'Использований: {count}', en: 'Used: {count} times' },
  'roleLibrary.noResults': { ru: 'Ничего не найдено', en: 'No results found' },
  'common.save': { ru: 'Сохранить', en: 'Save' },
  
  // Skeleton indicators for pending responses
  'skeleton.requestSent': { ru: 'Запрос отправлен...', en: 'Request sent...' },
  'skeleton.requestConfirmed': { ru: 'Получение подтверждено...', en: 'Request confirmed...' },
  'skeleton.waitingSeconds': { ru: 'Ждём {seconds} сек.', en: 'Waiting {seconds} sec.' },
  'skeleton.timedout': { ru: 'Эксперт {model} убежал на перекур..', en: 'Expert {model} went for a break..' },
  'skeleton.retryRequest': { ru: 'Персональный запрос', en: 'Personal request' },
  'skeleton.dismiss': { ru: 'Забыть', en: 'Dismiss' },
  'skeleton.removeModel': { ru: 'Уволить', en: 'Remove' },
  'skeleton.timeRemaining': { ru: 'До таймаута', en: 'Time remaining' },
  // Settings
  'settings.timeout': { ru: 'Таймаут ожидания', en: 'Response timeout' },
  'settings.timeoutDescription': { ru: 'Время ожидания ответа от эксперта до показа диалога действий', en: 'Time to wait for expert response before showing action dialog' },
  // Send button
  'send.toAllExperts': { ru: 'Всем экспертам', en: 'Send to all experts' },
  'consultant.deselect': { ru: 'Снять выбор консультанта', en: 'Deselect consultant' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  availableLanguages: { code: Language; name: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('ru');

  useEffect(() => {
    const saved = localStorage.getItem('hydra-language');
    if (saved === 'en' || saved === 'ru') {
      setLanguage(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hydra-language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  const availableLanguages = [
    { code: 'ru' as Language, name: 'Русский' },
    { code: 'en' as Language, name: 'English' },
  ];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, availableLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
