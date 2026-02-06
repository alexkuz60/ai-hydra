// ============================================
// HTTP Tool Executor for hydra-orchestrator
// Handles both testing and production execution
// ============================================

import { HttpConfig, HttpToolTestResult } from "./types.ts";
import { HTTP_TOOL_TIMEOUT_MS, HTTP_MAX_RESPONSE_SIZE } from "./constants.ts";

// ============================================
// URL Validation (SSRF Protection)
// ============================================

/**
 * Validates URL to prevent SSRF attacks.
 * Blocks internal/private network addresses.
 */
export function isInternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    
    // Block URLs with embedded credentials (bypass technique)
    if (parsed.username || parsed.password) {
      return true;
    }
    
    // Block internal IPv4 addresses
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.') ||  // AWS/Azure metadata service
      hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return true;
    }
    
    // Block internal IPv6 addresses
    if (
      hostname === '[::1]' ||       // IPv6 localhost
      hostname.startsWith('[fc') || // fc00::/7 unique local
      hostname.startsWith('[fd') || // fc00::/7 unique local
      hostname.startsWith('[fe80:') // fe80::/10 link-local
    ) {
      return true;
    }
    
    return false;
  } catch {
    return true; // Invalid URL, block it
  }
}

// ============================================
// Parameter Substitution
// ============================================

/**
 * Substitutes {{placeholder}} with values from args.
 */
export function substituteParams(template: string, args: Record<string, unknown>): string {
  let result = template;
  for (const [key, value] of Object.entries(args)) {
    const placeholder = `{{${key}}}`;
    result = result.replaceAll(placeholder, String(value ?? ''));
  }
  return result;
}

// ============================================
// JSONPath Extraction
// ============================================

/**
 * Extracts value from JSON using simplified JSONPath.
 * Supports dot notation and array indices: "data.items[0].name"
 */
export function extractByPath(obj: unknown, path: string): unknown {
  if (!path) return obj;
  
  const parts = path.split('.').flatMap(part => {
    // Handle array notation like items[0]
    const match = part.match(/^(\w+)\[(\d+)\]$/);
    if (match) {
      return [match[1], parseInt(match[2], 10)];
    }
    return [part];
  });
  
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof part === 'number') {
      if (!Array.isArray(current)) return undefined;
      current = current[part];
    } else {
      if (typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }
  }
  return current;
}

// ============================================
// Core HTTP Execution
// ============================================

interface HttpExecutionOptions {
  config: HttpConfig;
  args: Record<string, unknown>;
  timeout?: number;
  maxResponseSize?: number;
}

interface HttpExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  warning?: string;
  fullResponse?: unknown;
  responseBody?: string;
  statusCode?: number;
}

/**
 * Core HTTP execution logic shared by both test and production modes.
 */
async function executeHttpRequest(options: HttpExecutionOptions): Promise<HttpExecutionResult> {
  const { 
    config, 
    args, 
    timeout = HTTP_TOOL_TIMEOUT_MS,
    maxResponseSize = HTTP_MAX_RESPONSE_SIZE 
  } = options;
  
  try {
    // Substitute parameters in URL
    const url = substituteParams(config.url, args);
    
    // Validate URL
    if (isInternalUrl(url)) {
      return {
        success: false,
        error: 'Вызов внутренних адресов запрещён в целях безопасности'
      };
    }
    
    // Substitute parameters in headers
    const headers: Record<string, string> = {};
    if (config.headers) {
      for (const [key, value] of Object.entries(config.headers)) {
        headers[key] = substituteParams(value, args);
      }
    }
    
    // Add Content-Type for POST/PUT if not specified
    if ((config.method === 'POST' || config.method === 'PUT') && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    
    // Prepare body for POST/PUT
    let body: string | undefined;
    if (config.body_template && (config.method === 'POST' || config.method === 'PUT')) {
      body = substituteParams(config.body_template, args);
    }
    
    console.log(`[HTTP] ${config.method} ${url}`);
    
    // Execute request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        method: config.method,
        headers,
        body,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Check response size
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > maxResponseSize) {
        return {
          success: false,
          error: `Размер ответа превышает лимит (${maxResponseSize / 1024}KB)`
        };
      }
      
      // Read response
      const text = await response.text();
      
      if (text.length > maxResponseSize) {
        return {
          success: false,
          error: `Размер ответа превышает лимит (${maxResponseSize / 1024}KB)`
        };
      }
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          responseBody: text.slice(0, 500),
          statusCode: response.status
        };
      }
      
      // Parse response
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        // Not JSON, return as text
        data = text;
      }
      
      // Extract by path if specified
      let result = data;
      if (config.response_path) {
        result = extractByPath(data, config.response_path);
        if (result === undefined) {
          return {
            success: true,
            warning: `Путь '${config.response_path}' не найден в ответе`,
            fullResponse: data
          };
        }
      }
      
      return {
        success: true,
        data: result
      };
      
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return {
          success: false,
          error: `Таймаут запроса (${timeout / 1000} сек)`
        };
      }
      throw fetchError;
    }
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[HTTP] Error:`, message);
    return {
      success: false,
      error: `Ошибка HTTP запроса: ${message}`
    };
  }
}

// ============================================
// Public API
// ============================================

/**
 * Test HTTP tool directly (for UI testing before saving).
 */
export async function testHttpTool(
  config: HttpConfig,
  args: Record<string, unknown>
): Promise<HttpToolTestResult> {
  const result = await executeHttpRequest({ config, args });
  
  return {
    success: result.success,
    result: result.data,
    error: result.error,
    warning: result.warning,
    full_response: result.fullResponse,
    response_body: result.responseBody
  };
}

/**
 * Execute HTTP API tool (for production use).
 * Returns JSON string for tool calling interface.
 */
export async function executeHttpApiTool(
  toolName: string,
  args: Record<string, unknown>,
  config: HttpConfig
): Promise<string> {
  const result = await executeHttpRequest({ config, args });
  
  if (result.success) {
    return JSON.stringify({
      success: true,
      result: result.data
    });
  }
  
  const response: Record<string, unknown> = {
    success: false,
    error: result.error
  };
  
  if (result.warning) {
    response.warning = result.warning;
  }
  if (result.fullResponse) {
    response.full_response = result.fullResponse;
  }
  if (result.responseBody) {
    response.response_body = result.responseBody;
  }
  
  return JSON.stringify(response);
}
