// Tool Calling types and executors for hydra-orchestrator

// ============================================
// Type Definitions
// ============================================

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, {
        type: string;
        description?: string;
        enum?: string[];
      }>;
      required: string[];
    };
  };
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResult {
  tool_call_id: string;
  role: "tool";
  content: string;
}

// ============================================
// Tool Definitions
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
          }
        },
        required: ["query"]
      }
    }
  }
];

// ============================================
// Tool Executors
// ============================================

interface CalculatorArgs {
  expression: string;
}

interface DatetimeArgs {
  timezone?: string;
  format?: "full" | "date" | "time" | "iso";
}

interface WebSearchArgs {
  query: string;
  search_depth?: "basic" | "advanced";
  include_domains?: string;
  exclude_domains?: string;
}

// Safe math expression evaluator (no eval)
function evaluateMathExpression(expr: string): number {
  // Clean and normalize the expression
  let normalized = expr
    .replace(/\s+/g, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\^/g, '**')
    .toLowerCase();
  
  // Token types
  const NUMBER = /^(\d+\.?\d*|\.\d+)/;
  const OPERATOR = /^[+\-*/%]/;
  const POWER = /^\*\*/;
  const LPAREN = /^\(/;
  const RPAREN = /^\)/;
  const FUNCTION = /^(sin|cos|tan|asin|acos|atan|sqrt|log|log10|abs|round|floor|ceil|exp|pow)\(/;
  const CONSTANT = /^(pi|e)\b/;
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

async function executeWebSearch(args: WebSearchArgs): Promise<string> {
  const tavilyApiKey = Deno.env.get('TAVILY_API_KEY');
  
  if (!tavilyApiKey) {
    return JSON.stringify({
      success: false,
      error: "TAVILY_API_KEY не настроен. Веб-поиск недоступен."
    });
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
    
    // Add domain filters if provided
    if (args.include_domains) {
      requestBody.include_domains = args.include_domains.split(',').map(d => d.trim());
    }
    if (args.exclude_domains) {
      requestBody.exclude_domains = args.exclude_domains.split(',').map(d => d.trim());
    }
    
    console.log('[Tool] Web search request:', { query: args.query, search_depth: args.search_depth });
    
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Tool] Tavily API error:', response.status, errorText);
      return JSON.stringify({
        success: false,
        error: `Ошибка поиска: ${response.status} - ${errorText}`
      });
    }
    
    const data = await response.json();
    
    // Format results for the model
    const results = (data.results || []).map((r: { title: string; url: string; content: string; score?: number }) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      relevance: r.score
    }));
    
    return JSON.stringify({
      success: true,
      query: args.query,
      answer: data.answer || null,
      results,
      sources_count: results.length
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Tool] Web search error:', message);
    return JSON.stringify({
      success: false,
      error: `Ошибка веб-поиска: ${message}`
    });
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
    default:
      result = JSON.stringify({ success: false, error: `Unknown tool: ${funcName}` });
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
