// ============================================
// Tool Calling for hydra-orchestrator
// ============================================

import {
  ToolDefinition,
  ToolCall,
  ToolResult,
  CustomToolDefinition,
  CalculatorArgs,
  DatetimeArgs,
  WebSearchArgs,
  BriefPromptEngineerArgs,
  SearchProviderConfig,
  AvailableSearchProvider,
} from "./types.ts";

import {
  testHttpTool,
  executeHttpApiTool,
} from "./http-executor.ts";

// Re-export for external use
export type { ToolDefinition, ToolCall, ToolResult, CustomToolDefinition, SearchProviderConfig, AvailableSearchProvider };
export { testHttpTool };

// ============================================
// Built-in Tool Definitions
// ============================================

export const AVAILABLE_TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "calculator",
      description: "Вычисляет математические выражения. Поддерживает базовые операции (+, -, *, /, ^, %), скобки и математические функции (sin, cos, tan, sqrt, log, abs, round, floor, ceil, exp, pow).",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "Математическое выражение для вычисления, например: '2 + 2 * 3', 'sqrt(16) + pow(2, 3)', '15% от 2500' (напишите как '2500 * 0.15')"
          }
        },
        required: ["expression"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "current_datetime",
      description: "Возвращает текущую дату и время. Можно указать часовой пояс и формат.",
      parameters: {
        type: "object",
        properties: {
          timezone: {
            type: "string",
            description: "Часовой пояс в формате IANA, например: 'Europe/Moscow', 'America/New_York', 'Asia/Tokyo'. По умолчанию UTC."
          },
          format: {
            type: "string",
            description: "Формат вывода: 'full' (полный), 'date' (только дата), 'time' (только время), 'iso' (ISO 8601).",
            enum: ["full", "date", "time", "iso"]
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Выполняет поиск информации в интернете и возвращает актуальные результаты. Используйте для поиска новостей, фактов, статистики, документации и любой информации, которая может быть недоступна в обучающих данных модели.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Поисковый запрос на любом языке"
          },
          search_depth: {
            type: "string",
            description: "Глубина поиска: 'basic' (быстрый) или 'advanced' (глубокий, с большим контекстом)",
            enum: ["basic", "advanced"]
          },
          include_domains: {
            type: "string",
            description: "Домены для поиска (через запятую), например: 'wikipedia.org,arxiv.org'"
          },
          exclude_domains: {
            type: "string",
            description: "Домены для исключения (через запятую), например: 'pinterest.com'"
          },
          provider: {
            type: "string",
            description: "Провайдер поиска: 'tavily' (по умолчанию), 'perplexity' (требует ключ), или 'both' (два результата)",
            enum: ["tavily", "perplexity", "both"]
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "brief_prompt_engineer",
      description: "Подготавливает техническое задание для Промпт-Инженера на основе контекста текущей дискуссии. Возвращает структурированное ТЗ, которое будет передано Промпт-Инженеру для создания или оптимизации промпта.",
      parameters: {
        type: "object",
        properties: {
          task_description: {
            type: "string",
            description: "Детальное описание задачи: что требуется от Промпт-Инженера (создать промпт, оптимизировать существующий, адаптировать под роль и т.д.)"
          },
          context_summary: {
            type: "string",
            description: "Краткое резюме контекста из К-чата: ключевые решения, обсуждаемые темы, особенности задачи"
          },
          constraints: {
            type: "string",
            description: "Ограничения и требования через запятую, например: 'макс 500 токенов, формальный стиль, без эмодзи'"
          },
          target_role: {
            type: "string",
            description: "Целевая роль для которой нужен промпт, например: 'expert', 'critic', 'consultant'"
          },
          style: {
            type: "string",
            description: "Предпочтительный стиль промпта",
            enum: ["concise", "detailed", "structured", "creative"]
          }
        },
        required: ["task_description"]
      }
    }
  }
];

// ============================================
// Custom Tools Registry
// ============================================

let customToolsRegistry: Map<string, CustomToolDefinition> = new Map();

export function registerCustomTools(tools: CustomToolDefinition[]): void {
  customToolsRegistry.clear();
  for (const tool of tools) {
    customToolsRegistry.set(`custom_${tool.name}`, tool);
  }
  console.log(`[Tools] Registered ${tools.length} custom tools`);
}

// ============================================
// Calculator Implementation
// ============================================

/**
 * Safe math expression evaluator (no eval).
 * Supports: +, -, *, /, %, ^, parentheses, and math functions.
 */
function evaluateMathExpression(expr: string): number {
  // Clean and normalize the expression
  let normalized = expr
    .replace(/\s+/g, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\^/g, '**')
    .toLowerCase();
  
  // Token patterns
  const NUMBER = /^(\d+\.?\d*|\.\d+)/;
  const POWER = /^\*\*/;
  const LPAREN = /^\(/;
  const RPAREN = /^\)/;
  const FUNCTION = /^(sin|cos|tan|asin|acos|atan|sqrt|log|log10|abs|round|floor|ceil|exp|pow)\(/;
  const COMMA = /^,/;
  
  let pos = 0;
  
  function peek(): string {
    return normalized.slice(pos);
  }
  
  function consume(regex: RegExp): string | null {
    const match = peek().match(regex);
    if (match) {
      pos += match[0].length;
      return match[0];
    }
    return null;
  }
  
  function parseExpression(): number {
    let left = parseTerm();
    
    while (true) {
      const op = peek().match(/^[+\-]/);
      if (!op) break;
      pos++;
      const right = parseTerm();
      left = op[0] === '+' ? left + right : left - right;
    }
    
    return left;
  }
  
  function parseTerm(): number {
    let left = parsePower();
    
    while (true) {
      const op = peek().match(/^[*/%]/);
      if (!op || peek().startsWith('**')) break;
      pos++;
      const right = parsePower();
      if (op[0] === '*') left = left * right;
      else if (op[0] === '/') left = left / right;
      else left = left % right;
    }
    
    return left;
  }
  
  function parsePower(): number {
    let base = parseUnary();
    
    if (consume(POWER)) {
      const exp = parsePower(); // Right-associative
      return Math.pow(base, exp);
    }
    
    return base;
  }
  
  function parseUnary(): number {
    if (consume(/^-/)) {
      return -parseUnary();
    }
    if (consume(/^\+/)) {
      return parseUnary();
    }
    return parsePrimary();
  }
  
  function parsePrimary(): number {
    // Constants
    if (consume(/^pi\b/)) return Math.PI;
    if (consume(/^e\b/)) return Math.E;
    
    // Functions
    const funcMatch = peek().match(FUNCTION);
    if (funcMatch) {
      const funcName = funcMatch[0].slice(0, -1); // Remove '('
      pos += funcMatch[0].length;
      
      const args: number[] = [];
      if (!peek().startsWith(')')) {
        args.push(parseExpression());
        while (consume(COMMA)) {
          args.push(parseExpression());
        }
      }
      
      if (!consume(RPAREN)) {
        throw new Error(`Missing closing parenthesis for ${funcName}`);
      }
      
      switch (funcName) {
        case 'sin': return Math.sin(args[0]);
        case 'cos': return Math.cos(args[0]);
        case 'tan': return Math.tan(args[0]);
        case 'asin': return Math.asin(args[0]);
        case 'acos': return Math.acos(args[0]);
        case 'atan': return Math.atan(args[0]);
        case 'sqrt': return Math.sqrt(args[0]);
        case 'log': return Math.log(args[0]);
        case 'log10': return Math.log10(args[0]);
        case 'abs': return Math.abs(args[0]);
        case 'round': return Math.round(args[0]);
        case 'floor': return Math.floor(args[0]);
        case 'ceil': return Math.ceil(args[0]);
        case 'exp': return Math.exp(args[0]);
        case 'pow': return Math.pow(args[0], args[1] ?? 2);
        default: throw new Error(`Unknown function: ${funcName}`);
      }
    }
    
    // Parentheses
    if (consume(LPAREN)) {
      const result = parseExpression();
      if (!consume(RPAREN)) {
        throw new Error('Missing closing parenthesis');
      }
      return result;
    }
    
    // Number
    const numMatch = consume(NUMBER);
    if (numMatch) {
      return parseFloat(numMatch);
    }
    
    throw new Error(`Unexpected character at position ${pos}: ${peek().slice(0, 10)}`);
  }
  
  const result = parseExpression();
  
  if (pos < normalized.length) {
    throw new Error(`Unexpected character at position ${pos}: ${peek().slice(0, 10)}`);
  }
  
  return result;
}

function executeCalculator(args: CalculatorArgs): string {
  try {
    const result = evaluateMathExpression(args.expression);
    
    if (!isFinite(result)) {
      return JSON.stringify({
        success: false,
        error: "Результат не является конечным числом (деление на ноль или переполнение)",
        expression: args.expression
      });
    }
    
    // Format result nicely
    const formatted = Number.isInteger(result) 
      ? result.toString()
      : result.toPrecision(10).replace(/\.?0+$/, '');
    
    return JSON.stringify({
      success: true,
      expression: args.expression,
      result: parseFloat(formatted),
      formatted
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return JSON.stringify({
      success: false,
      error: message,
      expression: args.expression
    });
  }
}

// ============================================
// DateTime Implementation
// ============================================

function executeCurrentDatetime(args: DatetimeArgs): string {
  try {
    const timezone = args.timezone || 'UTC';
    const format = args.format || 'full';
    
    const now = new Date();
    
    // Validate timezone
    let formattedDate: string;
    try {
      const options: Intl.DateTimeFormatOptions = { timeZone: timezone };
      
      switch (format) {
        case 'iso':
          formattedDate = now.toISOString();
          break;
        case 'date':
          options.year = 'numeric';
          options.month = 'long';
          options.day = 'numeric';
          options.weekday = 'long';
          formattedDate = new Intl.DateTimeFormat('ru-RU', options).format(now);
          break;
        case 'time':
          options.hour = '2-digit';
          options.minute = '2-digit';
          options.second = '2-digit';
          options.hour12 = false;
          formattedDate = new Intl.DateTimeFormat('ru-RU', options).format(now);
          break;
        case 'full':
        default:
          options.year = 'numeric';
          options.month = 'long';
          options.day = 'numeric';
          options.weekday = 'long';
          options.hour = '2-digit';
          options.minute = '2-digit';
          options.second = '2-digit';
          options.hour12 = false;
          formattedDate = new Intl.DateTimeFormat('ru-RU', options).format(now);
      }
    } catch {
      return JSON.stringify({
        success: false,
        error: `Неизвестный часовой пояс: ${timezone}. Используйте формат IANA, например: 'Europe/Moscow', 'America/New_York'`
      });
    }
    
    return JSON.stringify({
      success: true,
      timezone,
      format,
      datetime: formattedDate,
      iso: now.toISOString(),
      unix_timestamp: Math.floor(now.getTime() / 1000)
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return JSON.stringify({
      success: false,
      error: message
    });
  }
}

// ============================================
// Web Search Implementation
// ============================================

/** User's search provider API keys (set per request) */
let searchProviderConfig: SearchProviderConfig = {
  tavilyKey: null,
  perplexityKey: null,
};

/** Set the user's search provider API keys for the current request */
export function setSearchProviderKeys(config: SearchProviderConfig): void {
  searchProviderConfig = config;
}

/** Get available search providers based on configured keys */
export function getAvailableSearchProviders(): AvailableSearchProvider {
  const hasTavily = !!searchProviderConfig.tavilyKey || !!Deno.env.get('TAVILY_API_KEY');
  const hasPerplexity = !!searchProviderConfig.perplexityKey;
  
  if (hasTavily && hasPerplexity) return "both";
  if (hasTavily) return "tavily";
  if (hasPerplexity) return "perplexity";
  return "none";
}

/** Execute Tavily search */
async function executeTavilySearch(args: WebSearchArgs): Promise<{ success: boolean; provider: string; answer?: string; results?: unknown[]; error?: string }> {
  const tavilyApiKey = searchProviderConfig.tavilyKey || Deno.env.get('TAVILY_API_KEY');
  const isPersonalKey = !!searchProviderConfig.tavilyKey;
  
  if (!tavilyApiKey) {
    return { success: false, provider: "tavily", error: "Tavily API-ключ не настроен" };
  }
  
  try {
    const requestBody: Record<string, unknown> = {
      api_key: tavilyApiKey,
      query: args.query,
      search_depth: args.search_depth || "basic",
      include_answer: true,
      include_raw_content: false,
      max_results: 5,
    };
    
    if (args.include_domains) {
      requestBody.include_domains = args.include_domains.split(',').map(d => d.trim());
    }
    if (args.exclude_domains) {
      requestBody.exclude_domains = args.exclude_domains.split(',').map(d => d.trim());
    }
    
    console.log('[Tool] Tavily search request:', { 
      query: args.query, 
      search_depth: args.search_depth,
      using_personal_key: isPersonalKey 
    });

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Tool] Tavily API error:', response.status, errorText);
      return { success: false, provider: "tavily", error: `Tavily ошибка: ${response.status}` };
    }
    
    const data = await response.json();
    const results = (data.results || []).map((r: { title: string; url: string; content: string; score?: number }) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      relevance: r.score
    }));
    
    return {
      success: true,
      provider: "tavily",
      answer: data.answer || null,
      results,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Tool] Tavily search error:', message);
    return { success: false, provider: "tavily", error: message };
  }
}

/** Execute Perplexity search */
async function executePerplexitySearch(args: WebSearchArgs): Promise<{ success: boolean; provider: string; answer?: string; results?: unknown[]; citations?: string[]; error?: string }> {
  const perplexityApiKey = searchProviderConfig.perplexityKey;
  
  if (!perplexityApiKey) {
    return { success: false, provider: "perplexity", error: "Perplexity API-ключ не настроен. Добавьте ключ в настройках профиля." };
  }
  
  try {
    console.log('[Tool] Perplexity search request:', { query: args.query });

    const requestBody: Record<string, unknown> = {
      model: 'sonar',
      messages: [
        { role: 'system', content: 'Отвечай кратко и по существу. Используй актуальные данные из поиска.' },
        { role: 'user', content: args.query }
      ],
    };
    
    // Add domain filters if provided
    if (args.include_domains) {
      requestBody.search_domain_filter = args.include_domains.split(',').map(d => d.trim());
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Tool] Perplexity API error:', response.status, errorText);
      return { success: false, provider: "perplexity", error: `Perplexity ошибка: ${response.status}` };
    }
    
    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || null;
    const citations = data.citations || [];
    
    // Convert citations to results format
    const results = citations.map((url: string, index: number) => ({
      title: `Источник ${index + 1}`,
      url,
      content: "",
    }));
    
    return {
      success: true,
      provider: "perplexity",
      answer,
      results,
      citations,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Tool] Perplexity search error:', message);
    return { success: false, provider: "perplexity", error: message };
  }
}

/** Main web search executor with provider selection */
async function executeWebSearch(args: WebSearchArgs): Promise<string> {
  const availableProviders = getAvailableSearchProviders();
  
  if (availableProviders === "none") {
    return JSON.stringify({
      success: false,
      error: "Веб-поиск недоступен. Добавьте Tavily или Perplexity API-ключ в настройках профиля."
    });
  }
  
  // Determine which provider(s) to use:
  // 1. Explicit provider from tool call args (model specified in call)
  // 2. Default provider from model settings (searchProviderConfig.defaultProvider)
  // 3. Fallback to "tavily"
  let requestedProvider = args.provider || searchProviderConfig.defaultProvider || "tavily";
  
  // If user requested a specific provider but doesn't have the key, fallback
  if (requestedProvider === "perplexity" && !searchProviderConfig.perplexityKey) {
    console.log('[Tool] Perplexity requested but no key, falling back to Tavily');
    requestedProvider = "tavily";
  }
  
  if (requestedProvider === "both" && availableProviders !== "both") {
    console.log('[Tool] Both providers requested but only one available, using:', availableProviders);
    requestedProvider = availableProviders as "tavily" | "perplexity";
  }
  
  console.log('[Tool] Web search with provider:', requestedProvider, 'available:', availableProviders);
  
  // Execute search based on provider selection
  if (requestedProvider === "both") {
    // Execute both searches in parallel
    const [tavilyResult, perplexityResult] = await Promise.all([
      executeTavilySearch(args),
      executePerplexitySearch(args),
    ]);
    
    return JSON.stringify({
      success: true,
      query: args.query,
      providers_used: ["tavily", "perplexity"],
      tavily: tavilyResult,
      perplexity: perplexityResult,
      combined_sources: (tavilyResult.results?.length || 0) + (perplexityResult.results?.length || 0),
    });
  }
  
  if (requestedProvider === "perplexity") {
    const result = await executePerplexitySearch(args);
    return JSON.stringify({
      success: result.success,
      query: args.query,
      provider: "perplexity",
      answer: result.answer,
      results: result.results,
      citations: result.citations,
      error: result.error,
    });
  }
  
  // Default: Tavily
  const result = await executeTavilySearch(args);
  return JSON.stringify({
    success: result.success,
    query: args.query,
    provider: "tavily",
    answer: result.answer,
    results: result.results,
    sources_count: result.results?.length || 0,
    error: result.error,
  });
}

// ============================================
// Brief Prompt Engineer Implementation
// ============================================

function executeBriefPromptEngineer(args: BriefPromptEngineerArgs): string {
  try {
    const { task_description, context_summary, constraints, target_role, style } = args;
    
    // Parse constraints - can be string (comma-separated) or array
    let constraintsList: string[] = [];
    if (constraints) {
      if (Array.isArray(constraints)) {
        constraintsList = constraints.filter((c: string) => c.length > 0);
      } else if (typeof constraints === 'string') {
        constraintsList = (constraints as string).split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0);
      }
    }
    
    // Build structured brief for Prompt Engineer
    const brief = {
      // Header
      type: "prompt_engineer_brief",
      created_at: new Date().toISOString(),
      
      // Task section
      objective: task_description,
      
      // Context section (optional)
      context: context_summary || null,
      
      // Requirements section
      requirements: {
        target_role: target_role || "general",
        style: style || "adaptive",
        constraints: constraintsList,
      },
      
      // Formatted markdown brief for human-readable output
      formatted_brief: formatBriefAsMarkdown(task_description, context_summary, constraintsList, target_role, style),
    };
    
    console.log('[Tool] Brief for Prompt Engineer generated:', brief);
    
    return JSON.stringify({
      success: true,
      brief,
      message: "Техническое задание для Промпт-Инженера сформировано",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return JSON.stringify({
      success: false,
      error: message
    });
  }
}

/** Format brief as structured markdown */
function formatBriefAsMarkdown(
  task: string, 
  context: string | undefined, 
  constraints: string[], 
  targetRole: string | undefined,
  style: string | undefined
): string {
  const sections: string[] = [];
  
  sections.push(`## 📋 Техническое задание для Промпт-Инженера\n`);
  
  sections.push(`### Цель\n${task}\n`);
  
  if (context) {
    sections.push(`### Контекст\n${context}\n`);
  }
  
  if (targetRole) {
    sections.push(`### Целевая роль\n${getRoleLabel(targetRole)}\n`);
  }
  
  if (style) {
    sections.push(`### Стиль промпта\n${getStyleLabel(style)}\n`);
  }
  
  if (constraints.length > 0) {
    sections.push(`### Ограничения\n${constraints.map(c => `- ${c}`).join('\n')}\n`);
  }
  
  return sections.join('\n');
}

/** Get human-readable role label */
function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    expert: "Эксперт",
    critic: "Критик",
    arbiter: "Арбитр",
    consultant: "Консультант",
    moderator: "Модератор",
    advisor: "Советник",
    archivist: "Архивариус",
    analyst: "Аналитик",
    webhunter: "Web-Охотник",
    promptengineer: "Промпт-Инженер",
    logistician: "Логистик",
    general: "Общая роль",
  };
  return labels[role] || role;
}

/** Get human-readable style label */
function getStyleLabel(style: string): string {
  const labels: Record<string, string> = {
    concise: "Лаконичный (минимум слов, максимум смысла)",
    detailed: "Детальный (подробные инструкции)",
    structured: "Структурированный (чёткие секции и пункты)",
    creative: "Креативный (неформальный, вдохновляющий)",
    adaptive: "Адаптивный (подстраивается под контекст)",
  };
  return labels[style] || style;
}

// ============================================
// Prompt Tool Execution
// ============================================

function executePromptTool(toolName: string, args: Record<string, unknown>, tool: CustomToolDefinition): string {
  // Substitute parameters in the prompt template
  let result = tool.prompt_template;
  for (const [key, value] of Object.entries(args)) {
    const placeholder = `{{${key}}}`;
    result = result.replaceAll(placeholder, String(value));
  }
  
  // Check for missing required parameters
  const missingParams = tool.parameters
    .filter(p => p.required && (args[p.name] === undefined || args[p.name] === ''))
    .map(p => p.name);
  
  if (missingParams.length > 0) {
    return JSON.stringify({
      success: false,
      error: `Missing required parameters: ${missingParams.join(', ')}`
    });
  }
  
  return JSON.stringify({
    success: true,
    tool_name: tool.display_name,
    result: result.trim()
  });
}

// ============================================
// Custom Tool Execution
// ============================================

async function executeCustomTool(toolName: string, args: Record<string, unknown>): Promise<string> {
  const customTool = customToolsRegistry.get(toolName);
  if (!customTool) {
    return JSON.stringify({ success: false, error: `Custom tool not found: ${toolName}` });
  }
  
  // Route based on tool type
  if (customTool.tool_type === 'http_api' && customTool.http_config) {
    return await executeHttpApiTool(toolName, args, customTool.http_config);
  } else {
    return executePromptTool(toolName, args, customTool);
  }
}

// ============================================
// Main Executor
// ============================================

export async function executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
  const { id, function: func } = toolCall;
  const funcName = func.name;
  
  let args: Record<string, unknown>;
  try {
    args = JSON.parse(func.arguments);
  } catch {
    return {
      tool_call_id: id,
      role: "tool",
      content: JSON.stringify({ success: false, error: "Invalid JSON in function arguments" })
    };
  }
  
  console.log(`[Tool] Executing ${funcName} with args:`, args);
  
  let result: string;
  
  // Check if it's a custom tool (prefixed with "custom_")
  if (funcName.startsWith("custom_")) {
    result = await executeCustomTool(funcName, args);
  } else {
    switch (funcName) {
      case "calculator":
        result = executeCalculator(args as unknown as CalculatorArgs);
        break;
      case "current_datetime":
        result = executeCurrentDatetime(args as unknown as DatetimeArgs);
        break;
      case "web_search":
        result = await executeWebSearch(args as unknown as WebSearchArgs);
        break;
      case "brief_prompt_engineer":
        result = executeBriefPromptEngineer(args as unknown as BriefPromptEngineerArgs);
        break;
      default:
        result = JSON.stringify({ success: false, error: `Unknown tool: ${funcName}` });
    }
  }
  
  console.log(`[Tool] ${funcName} result:`, result);
  
  return {
    tool_call_id: id,
    role: "tool",
    content: result
  };
}

export async function executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
  const results = await Promise.all(toolCalls.map(tc => executeToolCall(tc)));
  return results;
}
