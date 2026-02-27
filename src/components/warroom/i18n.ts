const dict = {
  // DateSeparator
  'date.today': { ru: 'Сегодня', en: 'Today' },
  'date.yesterday': { ru: 'Вчера', en: 'Yesterday' },

  // StreamingMessage
  'streaming.you': { ru: 'Вы', en: 'You' },
  'streaming.consultant': { ru: 'Консультант', en: 'Consultant' },
  'streaming.stop': { ru: 'Остановить', en: 'Stop' },

  // ChatMessage
  'message.fromContest': { ru: 'Из конкурса моделей', en: 'From model contest' },
  'message.followUp': { ru: 'Доп. вопрос', en: 'Follow-up' },

  // FlowDiagramPickerDialog
  'flowPicker.nodes': { ru: 'узлов', en: 'nodes' },
  'flowPicker.edges': { ru: 'связей', en: 'edges' },
  'flowPicker.preview': { ru: 'Превью', en: 'Preview' },
  'flowPicker.hoverToPreview': { ru: 'Наведите на диаграмму для превью', en: 'Hover over a diagram to preview' },

  // TaskFilesPanel
  'taskFiles.title': { ru: 'Дополнительные файлы для стратегического плана решения задачи', en: 'Additional files for strategic task plan' },
  'taskFiles.upload': { ru: 'Загрузить', en: 'Upload' },
  'taskFiles.noFiles': { ru: 'Нет прикреплённых файлов', en: 'No attached files' },
  'taskFiles.download': { ru: 'Скачать', en: 'Download' },
  'taskFiles.delete': { ru: 'Удалить', en: 'Delete' },
  'taskFiles.deleteConfirmTitle': { ru: 'Удалить файл?', en: 'Delete file?' },
  'taskFiles.deleteConfirmDesc': { ru: 'Файл «{name}» будет удалён безвозвратно.', en: 'File "{name}" will be permanently deleted.' },
  'taskFiles.cancel': { ru: 'Отмена', en: 'Cancel' },
  'taskFiles.viewAll': { ru: 'Просмотр файлов', en: 'View Files' },
  'taskFiles.commentPlaceholder': { ru: 'Для чего добавлен этот файл...', en: 'Why was this file added...' },
  'taskFiles.commentSaved': { ru: 'Комментарий сохранён', en: 'Comment saved' },
  'taskFiles.save': { ru: 'Сохранить', en: 'Save' },
  'taskFiles.digest': { ru: 'AI-дайджест', en: 'AI Digest' },
  'taskFiles.noDigest': { ru: 'Дайджест ещё не создан', en: 'Digest not yet generated' },
  'taskFiles.preview': { ru: 'Предпросмотр', en: 'Preview' },
  'taskFiles.scrapeUrl': { ru: 'Скрейпинг URL', en: 'Scrape URL' },
  'taskFiles.scrapeUrlPlaceholder': { ru: 'Введите URL для извлечения контента...', en: 'Enter URL to extract content...' },
  'taskFiles.scraping': { ru: 'Извлечение...', en: 'Extracting...' },
  'taskFiles.scrapeSuccess': { ru: 'Контент извлечён и сохранён как файл', en: 'Content extracted and saved as file' },
  'taskFiles.scrapeFailed': { ru: 'Ошибка извлечения контента', en: 'Failed to extract content' },
  'taskFiles.scrapeEmpty': { ru: 'Не удалось извлечь контент с этой страницы', en: 'Could not extract content from this page' },

  // Layout - AppSidebar
  'nav.guidedTour': { ru: 'Экскурсия', en: 'Guided Tour' },
  'nav.tourEditor': { ru: 'Редактор экскурсий', en: 'Tour Editor' },

  // Layout - MemoryControls
  'memory.domainKnowledge': { ru: 'Профильные знания (RAG)', en: 'Domain Knowledge (RAG)' },
} as const;

export type WarroomKey = keyof typeof dict;

export function wt(key: WarroomKey, lang: string): string {
  const entry = dict[key];
  return lang === 'ru' ? entry.ru : entry.en;
}
