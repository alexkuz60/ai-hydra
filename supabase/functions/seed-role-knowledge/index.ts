import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// Seed Role Knowledge Edge Function
// Pre-populates role_knowledge with system prompts
// and curated documentation for technical roles
// ============================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Chunk text into overlapping segments
function chunkText(text: string, maxChars = 1500, overlap = 200): string[] {
  if (text.length <= maxChars) return [text];
  
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = Math.min(start + maxChars, text.length);
    
    // Try to break at paragraph or sentence boundary
    if (end < text.length) {
      const slice = text.slice(start, end);
      const lastParagraph = slice.lastIndexOf('\n\n');
      const lastNewline = slice.lastIndexOf('\n');
      const lastPeriod = slice.lastIndexOf('. ');
      
      if (lastParagraph > maxChars * 0.5) {
        end = start + lastParagraph;
      } else if (lastNewline > maxChars * 0.5) {
        end = start + lastNewline;
      } else if (lastPeriod > maxChars * 0.5) {
        end = start + lastPeriod + 1;
      }
    }
    
    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
    if (start < 0) start = 0;
    if (end >= text.length) break;
  }
  
  return chunks.filter(c => c.length > 50);
}

// Role-specific knowledge content (curated documentation)
const ROLE_KNOWLEDGE: Record<string, Array<{
  source_title: string;
  category: string;
  content: string;
  tags: string[];
}>> = {
  archivist: [
    {
      source_title: "Архитектура памяти Hydra",
      category: "documentation",
      tags: ["память", "архитектура", "векторный поиск"],
      content: `# Система памяти AI-Hydra

## Типы памяти
1. **Сессионная память** (session_memory) — контекст текущей сессии, хранит решения, инструкции, резюме. Автоматически привязывается к session_id.
2. **Ролевая память** (role_memory) — долгосрочный опыт роли между сессиями. Типы: experience, preference, skill, mistake, success.
3. **Профильные знания** (role_knowledge) — статическая документация, мануалы, стандарты для конкретных ролей.

## Векторный поиск
Все типы памяти поддерживают семантический поиск через pgvector (text-embedding-3-small, 1536 размерностей). 
RPC-функции: search_session_memory, search_role_memory, search_role_knowledge.

## Инструменты Архивариуса
- **update_session_memory** — сохранение записей (decision, context, instruction, summary)
- **search_session_memory** — семантический поиск по памяти сессии
- **save_role_experience** — сохранение долгосрочного опыта
- **search_role_knowledge** — поиск по профильным знаниям

## Важность записей
Каждая запись имеет importance (1-10) и confidence_score (0.0-1.0). Высокая важность = выше приоритет при RAG-контексте.`,
    },
    {
      source_title: "Библиотека промптов",
      category: "procedure",
      tags: ["промпты", "библиотека", "управление"],
      content: `# Управление Библиотекой промптов

## Структура промпта в библиотеке
- **name** — уникальное название
- **role** — целевая роль (assistant, critic, arbiter и др.)
- **content** — текст промпта
- **tags** — теги для категоризации
- **is_shared** — публичный доступ
- **is_default** — используется по умолчанию для роли

## Операции
- Промпты доступны через RPC get_prompt_library_safe (безопасный доступ, скрывает user_id)
- Поддерживается embedding-поиск для семантического подбора
- Счётчик usage_count отслеживает частоту использования

## Рекомендации
- Структурируй промпты по секциям: роль, компетенции, методология, ограничения
- Используй теги для быстрого поиска
- Версионируй через разные записи, не перезаписывай`,
    },
  ],
  
  analyst: [
    {
      source_title: "Статистика моделей",
      category: "documentation",
      tags: ["статистика", "модели", "метрики"],
      content: `# Система статистики моделей

## Таблица model_statistics
Отслеживает использование каждой модели пользователем:
- **response_count** — количество ответов
- **total_brains** — суммарные "мозги" (оценки качества)
- **dismissal_count** — количество отклонений
- **first_used_at / last_used_at** — временные рамки использования

## Метрики для анализа
- **Коэффициент одобрения**: total_brains / response_count
- **Коэффициент отклонения**: dismissal_count / response_count
- **Частота использования**: response_count / period

## Группировка
Статистика привязана к session_id, что позволяет анализировать эффективность моделей в контексте конкретных задач.`,
    },
    {
      source_title: "Поведенческие паттерны",
      category: "documentation",
      tags: ["паттерны", "поведение", "анализ"],
      content: `# Система поведенческих паттернов

## Компоненты
- **role_behaviors** — настройки коммуникации, взаимодействий, реакций для каждой роли
- **task_blueprints** — стратегические шаблоны для многоэтапных рабочих процессов

## Категории блюпринтов
- planning — планирование проектов
- creative — творческие задачи
- analysis — аналитические процессы
- technical — технические пайплайны

## Аналитические задачи
- Сравнение эффективности паттернов через usage_count
- Анализ корреляции между паттерном и качеством ответов
- Выявление оптимальных комбинаций роль+паттерн`,
    },
  ],
  
  promptengineer: [
    {
      source_title: "Техники промпт-инженерии",
      category: "standard",
      tags: ["промпт-инженерия", "техники", "оптимизация"],
      content: `# Техники промпт-инженерии в Hydra

## Структура системного промпта
1. **Идентичность** — кто роль, в какой системе работает
2. **Компетенции** — что умеет
3. **Методология** — как выполняет задачи (пошагово)
4. **Взаимодействие** — как работает с другими ролями
5. **Ограничения** — что нельзя делать
6. **Пожелания Супервизора** — секция для динамических указаний

## Техники оптимизации
- **Chain-of-Thought** — разбиение на шаги для сложных задач
- **Few-shot примеры** — образцы ожидаемого результата
- **Role-playing** — погружение в роль для лучшего контекста
- **Constraints** — явные ограничения формата и содержания
- **Self-reflection** — инструкция проверить свой ответ

## Особенности моделей
- OpenAI GPT-5: хорошо работает с длинными структурированными промптами
- Gemini 2.5 Pro: отлично понимает многоязычные промпты
- Claude: чувствителен к формулировкам ограничений
- DeepSeek-R1: reasoning модель, не поддерживает temperature`,
    },
    {
      source_title: "Секции промптов",
      category: "procedure",
      tags: ["секции", "парсинг", "структура"],
      content: `# Система секций промптов

## Парсер секций (promptSectionParser)
Промпты в Hydra разбиваются на секции для индивидуального редактирования:
- Парсинг по заголовкам ## 
- Каждая секция имеет название и содержимое
- Поддержка конфликт-резолюции при параллельном редактировании

## Продвинутый редактор
AdvancedPromptEditor позволяет:
- Редактировать секции индивидуально
- Перетаскивать секции для изменения порядка
- Добавлять/удалять секции
- Предпросмотр финального промпта

## Стандарт именования секций
- "Идентичность" — описание роли
- "Компетенции" — навыки
- "Методология работы" — алгоритм
- "Взаимодействие с командой" — интеграция
- "Ограничения" — запреты
- "Пожелания Супервизора" — динамические указания`,
    },
  ],
  
  flowregulator: [
    {
      source_title: "Архитектура Flow Editor",
      category: "documentation",
      tags: ["flow", "редактор", "узлы", "архитектура"],
      content: `# Flow Editor — Архитектура

## Типы узлов
| Категория | Узел | Описание |
|-----------|------|----------|
| Input/Output | InputNode | Точка входа данных |
| Input/Output | OutputNode | Точка выхода данных |
| AI | ModelNode | Вызов ИИ-модели |
| AI | PromptNode | Шаблон промпта |
| AI | EmbeddingNode | Генерация эмбеддингов |
| AI | ClassifierNode | Классификация текста |
| Logic | ConditionNode | Условное ветвление |
| Logic | SwitchNode | Множественное ветвление |
| Logic | LoopNode | Цикл обработки |
| Logic | SplitNode | Параллельное разделение |
| Logic | MergeNode | Слияние потоков |
| Data | TransformNode | Трансформация данных |
| Data | FilterNode | Фильтрация данных |
| Data | MemoryNode | Работа с памятью |
| Data | DelayNode | Задержка выполнения |
| Integration | ApiNode | Вызов внешнего API |
| Integration | DatabaseNode | Запросы к БД |
| Integration | StorageNode | Работа с файлами |
| Layout | GroupNode | Группировка узлов |

## Правила соединений (connectionRules)
- Каждый тип узла имеет допустимые входы и выходы
- Валидация типов данных между узлами
- Защита от циклических зависимостей`,
    },
    {
      source_title: "Flow Runtime",
      category: "documentation",
      tags: ["runtime", "выполнение", "пайплайн"],
      content: `# Flow Runtime — Движок выполнения

## Архитектура
- **scheduler** — планировщик топологической сортировки узлов
- **executor** — исполнитель с контекстом данных
- **runners** — специализированные обработчики по типам узлов

## Процесс выполнения
1. Загрузка диаграммы из БД (flow_diagrams)
2. Топологическая сортировка узлов
3. Последовательное выполнение с передачей данных
4. Обработка ветвлений (condition, switch)
5. Агрегация результатов (merge)

## Валидация диаграмм (validate_flow_diagram tool)
Три уровня:
- **syntax** — наличие входа/выхода, осиротевшие связи
- **logic** — циклы, недостижимые узлы
- **optimization** — узкие места, длинные цепочки, дублирование

## Edge Function: flow-logistics
Обеспечивает вычисление метрик потока:
- Общая сложность
- Критический путь
- Оценка времени выполнения`,
    },
  ],
  
  toolsmith: [
    {
      source_title: "Система инструментов Hydra",
      category: "documentation",
      tags: ["инструменты", "tools", "интеграции"],
      content: `# Система пользовательских инструментов

## Типы инструментов
1. **Prompt-инструменты** — шаблоны с параметрами {{placeholder}}
   - Используются для обработки текста ИИ-моделью
   - Параметры подставляются перед выполнением
   
2. **HTTP-инструменты** — REST API интеграции
   - Поддержка методов: GET, POST, PUT, DELETE
   - Настраиваемые заголовки и тело запроса
   - JSONPath для извлечения данных из ответа (response_path)

## Безопасность
- SSRF-защита: блокировка localhost, внутренних IP, метаданных облака
- Максимальный размер ответа: 100KB
- Таймаут: 30 секунд
- Безопасный доступ через RPC get_custom_tools_safe (скрывает user_id)

## Режимы использования
- **always** — инструмент вызывается при каждом запросе
- **auto** — ИИ-роль решает, нужен ли инструмент
- **on_request** — только по явной просьбе пользователя

## Встроенные инструменты
- calculator — математические вычисления
- current_datetime — текущая дата/время
- web_search — поиск в интернете (Tavily/Perplexity)
- brief_prompt_engineer — подготовка ТЗ для Промпт-Инженера
- update_session_memory — сохранение в память сессии
- search_session_memory — поиск по памяти сессии
- validate_flow_diagram — валидация flow-диаграмм
- save_role_experience — сохранение опыта роли
- search_role_knowledge — поиск по профильным знаниям`,
    },
  ],
  
  webhunter: [
    {
      source_title: "Провайдеры поиска",
      category: "documentation",
      tags: ["поиск", "tavily", "perplexity", "web"],
      content: `# Провайдеры веб-поиска в Hydra

## Tavily
- Основной провайдер поиска
- Поддерживает basic и advanced глубину
- Фильтрация по доменам (include_domains, exclude_domains)
- Возвращает structured ответ с ранжированными результатами

## Perplexity
- Альтернативный провайдер (требует личный API-ключ)
- Использует модель "sonar" для поиска
- Возвращает синтезированный ответ с citations
- Хорошо подходит для обзорных запросов

## Режим "both"
- Параллельный поиск через оба провайдера
- Объединение результатов для максимального покрытия
- Полезен для верификации информации из разных источников

## Настройки
- Выбор провайдера в PerModelSettings
- Системный ключ Tavily как fallback
- Персональные ключи приоритетнее системных`,
    },
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Auth user
    const userSupabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const { role, include_system_prompt = true, force = false } = await req.json();
    
    if (!role) {
      return new Response(
        JSON.stringify({ error: "role is required" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check existing knowledge count (skip if already seeded, unless force)
    if (!force) {
      const { count } = await supabase
        .from('role_knowledge')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('role', role)
        .eq('category', 'documentation');
      
      if (count && count > 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            skipped: true, 
            message: `Role "${role}" already has ${count} documentation entries. Use force=true to re-seed.`,
            existing_count: count,
          }),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
    }

    // If force, delete existing seeded entries
    if (force) {
      const { error: deleteError } = await supabase
        .from('role_knowledge')
        .delete()
        .eq('user_id', user.id)
        .eq('role', role)
        .in('category', ['documentation', 'standard', 'procedure', 'system_prompt']);
      
      if (deleteError) {
        console.error('[seed] Delete error:', deleteError);
      }
    }

    const entries: Array<{
      user_id: string;
      role: string;
      content: string;
      source_title: string;
      category: string;
      chunk_index: number;
      chunk_total: number;
      tags: string[];
      metadata: Record<string, unknown>;
    }> = [];

    // 1. Seed system prompt as knowledge
    if (include_system_prompt) {
      const systemPromptContent = `Системный промпт роли "${role}" — это основная инструкция, определяющая поведение, компетенции и ограничения данной роли в системе AI-Hydra.`;
      
      entries.push({
        user_id: user.id,
        role,
        content: systemPromptContent,
        source_title: "Системный промпт роли",
        category: "system_prompt",
        chunk_index: 0,
        chunk_total: 1,
        tags: ["системный промпт", "идентичность", role],
        metadata: { seeded: true, source: "system" },
      });
    }

    // 2. Seed role-specific knowledge
    const roleKnowledge = ROLE_KNOWLEDGE[role];
    if (roleKnowledge) {
      for (const item of roleKnowledge) {
        const chunks = chunkText(item.content);
        for (let i = 0; i < chunks.length; i++) {
          entries.push({
            user_id: user.id,
            role,
            content: chunks[i],
            source_title: item.source_title,
            category: item.category,
            chunk_index: i,
            chunk_total: chunks.length,
            tags: item.tags,
            metadata: { seeded: true, source: "hydrapedia" },
          });
        }
      }
    }

    if (entries.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          seeded: 0, 
          message: `No knowledge sources found for role "${role}"` 
        }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Generate embeddings for all entries
    let embeddingsGenerated = 0;
    const texts = entries.map(e => e.content);
    
    try {
      // Batch embedding generation (max 20 per call)
      for (let i = 0; i < texts.length; i += 20) {
        const batch = texts.slice(i, i + 20);
        const embResp = await fetch(`${supabaseUrl}/functions/v1/generate-embeddings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ texts: batch }),
        });
        
        if (embResp.ok) {
          const embData = await embResp.json();
          if (!embData.skipped && embData.embeddings) {
            for (let j = 0; j < embData.embeddings.length; j++) {
              if (embData.embeddings[j]) {
                (entries[i + j] as Record<string, unknown>).embedding = 
                  `[${embData.embeddings[j].join(',')}]`;
                embeddingsGenerated++;
              }
            }
          }
        }
      }
    } catch (embError) {
      console.warn('[seed] Embedding generation failed:', embError);
    }

    // Insert all entries
    const { error: insertError } = await supabase
      .from('role_knowledge')
      .insert(entries);
    
    if (insertError) {
      console.error('[seed] Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: `Insert failed: ${insertError.message}` }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    console.log(`[seed] Seeded ${entries.length} entries for role "${role}", embeddings: ${embeddingsGenerated}`);

    return new Response(
      JSON.stringify({
        success: true,
        role,
        seeded: entries.length,
        embeddings_generated: embeddingsGenerated,
        sources: [...new Set(entries.map(e => e.source_title))],
      }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[seed] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
