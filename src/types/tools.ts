// Tool Calling types for frontend

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
  content: string;
  parsed?: {
    success: boolean;
    result?: unknown;
    error?: string;
    [key: string]: unknown;
  };
}

export interface ToolCallMetadata {
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
}

// Parse tool result content into a structured object
export function parseToolResult(content: string): ToolResult['parsed'] {
  try {
    return JSON.parse(content);
  } catch {
    return { success: false, error: 'Failed to parse tool result' };
  }
}

// Get tool display name
export function getToolDisplayName(toolName: string): string {
  const names: Record<string, string> = {
    calculator: 'Калькулятор',
    current_datetime: 'Дата и время',
    web_search: 'Веб-поиск',
  };
  return names[toolName] || toolName;
}

// Get tool icon name (for lucide-react)
export function getToolIconName(toolName: string): string {
  const icons: Record<string, string> = {
    calculator: 'Calculator',
    current_datetime: 'Clock',
    web_search: 'Search',
  };
  return icons[toolName] || 'Wrench';
}
