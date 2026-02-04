// Custom Tools type definitions

export type ToolType = 'prompt' | 'http_api';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type OwnerFilter = 'all' | 'own' | 'shared';

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  required: boolean;
  [key: string]: unknown;
}

export interface HttpConfig {
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body_template?: string;
  response_path?: string;
}

export interface CustomTool {
  id: string;
  name: string;
  display_name: string;
  description: string;
  prompt_template: string;
  parameters: ToolParameter[];
  is_shared: boolean;
  usage_count: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  tool_type: ToolType;
  http_config: HttpConfig | null;
}

export interface ToolFormData {
  name: string;
  displayName: string;
  description: string;
  promptTemplate: string;
  parameters: ToolParameter[];
  isShared: boolean;
  toolType: ToolType;
  httpUrl: string;
  httpMethod: HttpMethod;
  httpHeaders: { key: string; value: string }[];
  httpBodyTemplate: string;
  httpResponsePath: string;
}

export const PARAM_TYPES = [
  { value: 'string', labelKey: 'tools.paramType.string' },
  { value: 'number', labelKey: 'tools.paramType.number' },
  { value: 'boolean', labelKey: 'tools.paramType.boolean' },
] as const;

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE'];

export function getEmptyFormData(): ToolFormData {
  return {
    name: '',
    displayName: '',
    description: '',
    promptTemplate: '',
    parameters: [],
    isShared: false,
    toolType: 'prompt',
    httpUrl: '',
    httpMethod: 'GET',
    httpHeaders: [],
    httpBodyTemplate: '',
    httpResponsePath: '',
  };
}

export function toolToFormData(tool: CustomTool): ToolFormData {
  const hc = tool.http_config;
  return {
    name: tool.name,
    displayName: tool.display_name,
    description: tool.description,
    promptTemplate: tool.prompt_template,
    parameters: [...tool.parameters],
    isShared: tool.is_shared,
    toolType: tool.tool_type || 'prompt',
    httpUrl: hc?.url || '',
    httpMethod: hc?.method || 'GET',
    httpHeaders: hc?.headers 
      ? Object.entries(hc.headers).map(([key, value]) => ({ key, value })) 
      : [],
    httpBodyTemplate: hc?.body_template || '',
    httpResponsePath: hc?.response_path || '',
  };
}

export function validateToolName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}
