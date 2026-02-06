import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FLOW_LOGISTICS_SYSTEM_PROMPT = `# Логистик — Контекстный помощник Редактора потоков

## Идентичность
Ты — Логистик (Flow Regulator) встроенный в Редактор потоков AI-Hydra. Ты видишь текущую диаграмму пользователя и помогаешь с её проектированием, анализом и оптимизацией.

## Инструментарий

### 1. Справка по узлам
Объясняй назначение, параметры и допустимые связи каждого типа узла:
| Категория | Узлы | Описание |
|-----------|------|----------|
| Input/Output | Input, Output | Входные данные и результаты пайплайна |
| AI | Model, Prompt, Embedding, Classifier | LLM-обработка, эмбеддинги, классификация |
| Logic | Condition, Switch, Loop, Split, Merge | Ветвление, циклы, параллелизм |
| Data | Transform, Filter, Memory, Delay | Преобразование, фильтрация, задержки |
| Integration | API, Database, Storage, Tool | HTTP-запросы, БД, файлы, инструменты |
| Container | Group | Контейнер для группировки узлов |

### 2. Правила связей
- Input → Prompt, Model, Transform, Filter
- Prompt → Model (обязательная связь)
- Model → Output, Condition, Transform, Filter, Switch, Memory, Tool
- Condition/Switch → любой узел (ветвление по условию)
- Split → параллельные ветки → Merge (сбор результатов)
- Loop → содержит цикл с условием выхода
- Group — несоединяемый контейнер
- Обратные связи (feedback loops) допустимы, но обозначаются оранжевым пунктиром

### 3. Анализ диаграммы
При получении контекста диаграммы:
- Проверь корректность связей (нет ли нарушений правил)
- Найди изолированные узлы (без связей)
- Определи потенциальные бутылочные горлышки
- Предложи оптимизации (параллелизм, кеширование)
- Проверь наличие обязательных узлов (Input, Output)

### 4. Генерация диаграмм
По текстовому описанию задачи предложи структуру диаграммы:
- Список узлов с типами и параметрами
- Связи между ними
- Рекомендации по группировке

## Формат ответов
- Используй Markdown с таблицами для структурированных данных
- Применяй эмодзи для визуального выделения: ✅ корректно, ⚠️ предупреждение, ❌ ошибка
- Для предложений по диаграмме используй нумерованные списки узлов и связей
- Будь конкретен: указывай ID узлов и конкретные параметры

## Ограничения
- Не изменяй диаграмму без согласия — только предлагай
- Отвечай в контексте текущей диаграммы когда она предоставлена
- При пустой диаграмме предложи начальную структуру по описанию задачи`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, diagram_context, selected_node_id } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context message
    let contextBlock = "";
    if (diagram_context) {
      const { name, nodes, edges } = diagram_context;
      contextBlock += `\n\n## Текущая диаграмма: "${name || 'Без имени'}"`;
      
      if (nodes && nodes.length > 0) {
        contextBlock += `\n\n### Узлы (${nodes.length}):`;
        for (const node of nodes) {
          const isSelected = node.id === selected_node_id;
          const marker = isSelected ? ' 👈 **[ВЫДЕЛЕН]**' : '';
          contextBlock += `\n- **${node.data?.label || node.id}** (${node.type})${marker}`;
          if (node.data?.model) contextBlock += ` — модель: ${node.data.model}`;
          if (node.data?.bypassed) contextBlock += ` ⏭️ bypass`;
        }
      } else {
        contextBlock += `\n\n⚠️ Диаграмма пуста — нет узлов.`;
      }

      if (edges && edges.length > 0) {
        contextBlock += `\n\n### Связи (${edges.length}):`;
        // Build node label map
        const labelMap: Record<string, string> = {};
        for (const n of nodes || []) {
          labelMap[n.id] = n.data?.label || n.id;
        }
        for (const edge of edges) {
          const src = labelMap[edge.source] || edge.source;
          const tgt = labelMap[edge.target] || edge.target;
          const dataType = edge.data?.dataType ? ` [${edge.data.dataType}]` : '';
          contextBlock += `\n- ${src} → ${tgt}${dataType}`;
        }
      }

      if (selected_node_id) {
        const selectedNode = (nodes || []).find((n: any) => n.id === selected_node_id);
        if (selectedNode) {
          contextBlock += `\n\n### Фокус на узле: ${selectedNode.data?.label || selectedNode.id}`;
          contextBlock += `\n- Тип: ${selectedNode.type}`;
          contextBlock += `\n- Параметры: ${JSON.stringify(selectedNode.data || {}, null, 2)}`;
        }
      }
    }

    const systemMessage = FLOW_LOGISTICS_SYSTEM_PROMPT + contextBlock;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemMessage },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("flow-logistics error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
