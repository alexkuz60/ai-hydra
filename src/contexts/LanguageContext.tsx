import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  'nav.warRoom': { ru: 'War Room', en: 'War Room' },
  'nav.tasks': { ru: 'Задачи', en: 'Tasks' },
  'nav.profile': { ru: 'Профиль', en: 'Profile' },
  'nav.settings': { ru: 'Настройки', en: 'Settings' },
  'nav.logout': { ru: 'Выйти', en: 'Logout' },
  'nav.login': { ru: 'Войти', en: 'Login' },
  'nav.signup': { ru: 'Регистрация', en: 'Sign Up' },
  'nav.admin': { ru: 'Админ-панель', en: 'Admin Panel' },
  
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
  
  // Home / Hero
  'hero.title': { ru: 'AI-Hydra', en: 'AI-Hydra' },
  'hero.subtitle': { ru: 'Мультиагентная платформа синергии', en: 'Multi-Agent Synergy Platform' },
  'hero.description': { ru: 'Ансамбль LLM моделей для решения сверхсложных задач', en: 'LLM ensemble for solving ultra-complex problems' },
  'hero.getStarted': { ru: 'Начать работу', en: 'Get Started' },
  'hero.learnMore': { ru: 'Подробнее', en: 'Learn More' },
  
  // War Room
  'warRoom.title': { ru: 'War Room', en: 'War Room' },
  'warRoom.mainStage': { ru: 'Ответ Арбитра', en: 'Arbiter Response' },
  'warRoom.experts': { ru: 'Эксперты', en: 'Experts' },
  'warRoom.critic': { ru: 'Критик', en: 'Critic' },
  'warRoom.sendPrompt': { ru: 'Отправить запрос', en: 'Send Prompt' },
  'warRoom.placeholder': { ru: 'Введите ваш запрос...', en: 'Enter your prompt...' },
  'warRoom.noSession': { ru: 'Выберите или создайте задачу', en: 'Select or create a task' },
  'warRoom.noApiKeys': { ru: 'Нет доступных моделей. Добавьте API ключи в профиле.', en: 'No models available. Add API keys in profile.' },
  'warRoom.selectModel': { ru: 'Выберите модель', en: 'Select model' },
  'warRoom.selectModels': { ru: 'Выберите модели', en: 'Select models' },
  'warRoom.modelsSelected': { ru: 'Выбрано: {count}', en: '{count} selected' },
  'warRoom.personalKeys': { ru: 'Персональные ключи', en: 'Personal Keys' },
  
  // Tasks (formerly Sessions)
  'tasks.title': { ru: 'Задачи', en: 'Tasks' },
  'tasks.new': { ru: 'Новая задача', en: 'New Task' },
  'tasks.empty': { ru: 'Нет активных задач', en: 'No active tasks' },
  'tasks.delete': { ru: 'Удалить', en: 'Delete' },
  'tasks.search': { ru: 'Поиск задач...', en: 'Search tasks...' },
  'tasks.noResults': { ru: 'Задачи не найдены', en: 'No tasks found' },
  'tasks.deleteConfirmTitle': { ru: 'Удалить задачу?', en: 'Delete task?' },
  'tasks.deleteConfirmDescription': { ru: 'Это действие нельзя отменить. Задача и все связанные сообщения будут удалены навсегда.', en: 'This action cannot be undone. The task and all related messages will be permanently deleted.' },
  
  // Models
  'model.gemini': { ru: 'Gemini Pro', en: 'Gemini Pro' },
  'model.gpt': { ru: 'GPT-4', en: 'GPT-4' },
  'model.claude': { ru: 'Claude', en: 'Claude' },
  'model.grok': { ru: 'Grok', en: 'Grok' },
  
  // Roles
  'role.user': { ru: 'Пользователь', en: 'User' },
  'role.assistant': { ru: 'Ассистент', en: 'Assistant' },
  'role.critic': { ru: 'Критик', en: 'Critic' },
  'role.arbiter': { ru: 'Арбитр', en: 'Arbiter' },
  
  // Common
  'common.loading': { ru: 'Загрузка...', en: 'Loading...' },
  'common.error': { ru: 'Ошибка', en: 'Error' },
  'common.success': { ru: 'Успешно', en: 'Success' },
  'common.cancel': { ru: 'Отмена', en: 'Cancel' },
  'common.confirm': { ru: 'Подтвердить', en: 'Confirm' },
  'common.addLanguage': { ru: 'Добавить язык...', en: 'Add language...' },
  'common.selectAll': { ru: 'Выбрать все', en: 'Select all' },
  'common.deselectAll': { ru: 'Снять все', en: 'Deselect all' },
  
  // Settings
  'settings.modelSettings': { ru: 'Настройки модели', en: 'Model Settings' },
  'settings.role': { ru: 'Роль агента', en: 'Agent Role' },
  'settings.temperature': { ru: 'Температура', en: 'Temperature' },
  'settings.maxTokens': { ru: 'Макс. токенов', en: 'Max Tokens' },
  'settings.systemPrompt': { ru: 'Системный промпт', en: 'System Prompt' },
  'settings.systemPromptPlaceholder': { ru: 'Введите инструкции для модели...', en: 'Enter instructions for the model...' },
  'settings.resetDefaults': { ru: 'Сбросить настройки', en: 'Reset to Defaults' },
  'settings.precise': { ru: 'Точность', en: 'Precise' },
  'settings.creative': { ru: 'Креатив', en: 'Creative' },
  
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
