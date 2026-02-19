// ─── Technical Terms Glossary for Hydra Memory ──────────────────────────────
// Maps raw field names to human-readable labels with descriptions (RU/EN).
// Used by <TermLabel> to render tooltips on hover.

export interface GlossaryEntry {
  labelRu: string;
  labelEn: string;
  descRu: string;
  descEn: string;
}

export const MEMORY_GLOSSARY: Record<string, GlossaryEntry> = {
  // ── Session Memory ──────────────────────────────────────────────────────
  chunk_type: {
    labelRu: 'Тип чанка',
    labelEn: 'Chunk type',
    descRu: 'Категория фрагмента памяти: решение, контекст, инструкция, оценка, итог или сообщение.',
    descEn: 'Memory fragment category: decision, context, instruction, evaluation, summary, or message.',
  },
  retrieved_count: {
    labelRu: 'Извлечений',
    labelEn: 'Retrievals',
    descRu: 'Сколько раз этот фрагмент был извлечён RAG-системой для контекста при генерации ответов.',
    descEn: 'How many times this chunk was retrieved by the RAG system for context during response generation.',
  },
  relevance_score: {
    labelRu: 'Релевантность',
    labelEn: 'Relevance',
    descRu: 'Средняя косинусная близость при извлечении. Чем выше — тем лучше фрагмент соответствует запросу.',
    descEn: 'Average cosine similarity during retrieval. Higher means better match to the query.',
  },
  similarity: {
    labelRu: 'Сходство',
    labelEn: 'Similarity',
    descRu: 'Косинусная близость между запросом и фрагментом при семантическом поиске (0–100%).',
    descEn: 'Cosine similarity between query and chunk during semantic search (0–100%).',
  },
  hybrid_score: {
    labelRu: 'Гибридный балл',
    labelEn: 'Hybrid score',
    descRu: 'Объединённый балл текстового (BM25) и семантического (pgvector) поиска через RRF.',
    descEn: 'Combined score of text (BM25) and semantic (pgvector) search via RRF fusion.',
  },
  feedback: {
    labelRu: 'Фидбек',
    labelEn: 'Feedback',
    descRu: 'Оценка полезности фрагмента пользователем: 👍 полезно или 👎 не полезно.',
    descEn: 'User rating of chunk usefulness: 👍 helpful or 👎 not helpful.',
  },
  last_retrieved_at: {
    labelRu: 'Последнее извлечение',
    labelEn: 'Last retrieved',
    descRu: 'Дата и время последнего использования этого фрагмента RAG-системой.',
    descEn: 'Date and time this chunk was last used by the RAG system.',
  },

  // ── Role Memory ─────────────────────────────────────────────────────────
  memory_type: {
    labelRu: 'Тип памяти',
    labelEn: 'Memory type',
    descRu: 'Категория записи: опыт, предпочтение, навык, ошибка или успех.',
    descEn: 'Entry category: experience, preference, skill, mistake, or success.',
  },
  confidence_score: {
    labelRu: 'Уверенность',
    labelEn: 'Confidence',
    descRu: 'Степень достоверности записи (0–100%). Оценивается при создании и корректируется при использовании.',
    descEn: 'Entry reliability score (0–100%). Set at creation and adjusted through usage.',
  },
  avg_confidence: {
    labelRu: 'Средняя уверенность',
    labelEn: 'Avg confidence',
    descRu: 'Среднее значение confidence_score по всем записям роли.',
    descEn: 'Average confidence_score across all entries for a role.',
  },
  usage_count: {
    labelRu: 'Использований',
    labelEn: 'Usage count',
    descRu: 'Сколько раз эта запись была извлечена и использована в контексте генерации.',
    descEn: 'How many times this entry was retrieved and used in generation context.',
  },

  // ── Knowledge Base ──────────────────────────────────────────────────────
  chunk_index: {
    labelRu: 'Индекс чанка',
    labelEn: 'Chunk index',
    descRu: 'Порядковый номер фрагмента в документе (при разбиении текста на части).',
    descEn: 'Sequential number of the fragment in the document (when splitting text).',
  },
  embedding: {
    labelRu: 'Эмбеддинг',
    labelEn: 'Embedding',
    descRu: 'Векторное представление текста (1536 измерений), используемое для семантического поиска.',
    descEn: 'Vector representation of text (1536 dimensions) used for semantic search.',
  },
  version: {
    labelRu: 'Версия',
    labelEn: 'Version',
    descRu: 'Версия документа. Более старые версии помечаются как устаревшие при дедупликации.',
    descEn: 'Document version. Older versions are flagged as outdated during deduplication.',
  },
  source_url: {
    labelRu: 'Источник',
    labelEn: 'Source URL',
    descRu: 'URL-адрес или ссылка на оригинальный документ-источник.',
    descEn: 'URL or reference to the original source document.',
  },

  // ── Model Statistics ────────────────────────────────────────────────────
  response_count: {
    labelRu: 'Ответов',
    labelEn: 'Responses',
    descRu: 'Общее количество сгенерированных ответов этой моделью.',
    descEn: 'Total number of responses generated by this model.',
  },
  total_brains: {
    labelRu: 'Мозгов',
    labelEn: 'Brains',
    descRu: 'Суммарное количество «мозгов» (оценок полезности), полученных моделью от пользователя.',
    descEn: 'Total number of "brains" (usefulness ratings) received by the model from the user.',
  },
  arbiter_score: {
    labelRu: 'Балл арбитра',
    labelEn: 'Arbiter score',
    descRu: 'Средняя оценка модели от ИИ-арбитра по результатам конкурсов.',
    descEn: 'Average model score from the AI arbiter based on contest results.',
  },
  arbiter_eval_count: {
    labelRu: 'Оценок арбитра',
    labelEn: 'Arbiter evals',
    descRu: 'Количество раз, когда ИИ-арбитр оценивал ответы этой модели.',
    descEn: 'Number of times the AI arbiter evaluated responses from this model.',
  },
  contest_count: {
    labelRu: 'Конкурсов',
    labelEn: 'Contests',
    descRu: 'Количество конкурсов, в которых участвовала модель.',
    descEn: 'Number of contests the model participated in.',
  },
  contest_total_score: {
    labelRu: 'Суммарный балл',
    labelEn: 'Total contest score',
    descRu: 'Суммарный балл модели по всем конкурсам.',
    descEn: 'Total score accumulated by the model across all contests.',
  },
  hallucination_count: {
    labelRu: 'Галлюцинаций',
    labelEn: 'Hallucinations',
    descRu: 'Количество зафиксированных случаев галлюцинации (генерации недостоверной информации).',
    descEn: 'Number of recorded hallucination incidents (generating unreliable information).',
  },
  dismissal_count: {
    labelRu: 'Увольнений',
    labelEn: 'Dismissals',
    descRu: 'Количество раз, когда модель была снята с роли по результатам переаттестации.',
    descEn: 'Number of times the model was removed from a role after recertification.',
  },
  critique_summary: {
    labelRu: 'Критика',
    labelEn: 'Critique',
    descRu: 'Краткое резюме от арбитра о сильных и слабых сторонах модели.',
    descEn: 'Brief arbiter summary of the model\'s strengths and weaknesses.',
  },
  criteria_averages: {
    labelRu: 'Средние по критериям',
    labelEn: 'Criteria averages',
    descRu: 'Средние баллы модели по каждому критерию оценки конкурса.',
    descEn: 'Average model scores for each contest evaluation criterion.',
  },

  // ── RAG Analytics ───────────────────────────────────────────────────────
  avg_relevance: {
    labelRu: 'Средняя релевантность',
    labelEn: 'Avg relevance',
    descRu: 'Среднее значение релевантности извлечённых фрагментов. Показывает качество работы RAG-поиска.',
    descEn: 'Average relevance of retrieved chunks. Indicates RAG search quality.',
  },
  total_retrievals: {
    labelRu: 'Всего извлечений',
    labelEn: 'Total retrievals',
    descRu: 'Общее количество обращений к памяти за всё время.',
    descEn: 'Total number of memory retrievals across all time.',
  },

  // ── Chronicles Metrics ──────────────────────────────────────────────────
  cost_delta: {
    labelRu: 'Дельта стоимости',
    labelEn: 'Cost delta',
    descRu: 'Изменение стоимости ($/запрос) после эволюции. Отрицательное значение = экономия.',
    descEn: 'Cost change ($/request) after evolution. Negative value = savings.',
  },
  avg_latency_sec: {
    labelRu: 'Средняя задержка (сек.)',
    labelEn: 'Avg latency (sec)',
    descRu: 'Средняя задержка ответа модели в секундах.',
    descEn: 'Average model response latency in seconds.',
  },
  latency_ms: {
    labelRu: 'Задержка (мс)',
    labelEn: 'Latency (ms)',
    descRu: 'Время от отправки запроса до получения ответа в миллисекундах.',
    descEn: 'Time from request to response in milliseconds.',
  },
  tokens_input: {
    labelRu: 'Токены (вход)',
    labelEn: 'Input tokens',
    descRu: 'Количество входных токенов (промпт + контекст), отправленных модели.',
    descEn: 'Number of input tokens (prompt + context) sent to the model.',
  },
  tokens_output: {
    labelRu: 'Токены (выход)',
    labelEn: 'Output tokens',
    descRu: 'Количество выходных токенов, сгенерированных моделью в ответе.',
    descEn: 'Number of output tokens generated by the model in the response.',
  },
  token_count: {
    labelRu: 'Кол-во токенов',
    labelEn: 'Token count',
    descRu: 'Общее количество токенов в ответе модели.',
    descEn: 'Total number of tokens in the model response.',
  },

  // ── Graph ───────────────────────────────────────────────────────────────
  session_chunks: {
    labelRu: 'Чанков сессии',
    labelEn: 'Session chunks',
    descRu: 'Количество сохранённых фрагментов памяти в данной сессии.',
    descEn: 'Number of saved memory fragments in this session.',
  },
  knowledge_count: {
    labelRu: 'Записей знаний',
    labelEn: 'Knowledge entries',
    descRu: 'Количество проиндексированных документов для семантического поиска по этой роли.',
    descEn: 'Number of indexed documents for semantic search for this role.',
  },
};

/**
 * Get the localized label for a glossary term.
 */
export function getTermLabel(term: string, isRu: boolean): string {
  const entry = MEMORY_GLOSSARY[term];
  if (!entry) return term;
  return isRu ? entry.labelRu : entry.labelEn;
}

/**
 * Get the localized description for a glossary term.
 */
export function getTermDescription(term: string, isRu: boolean): string | undefined {
  const entry = MEMORY_GLOSSARY[term];
  if (!entry) return undefined;
  return isRu ? entry.descRu : entry.descEn;
}
