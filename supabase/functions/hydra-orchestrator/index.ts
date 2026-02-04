import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Local module imports
import {
  AVAILABLE_TOOLS,
  executeToolCalls,
  registerCustomTools,
  testHttpTool,
  setSearchProviderKeys,
  getAvailableSearchProviders,
  setExecutionContext,
} from "./tools.ts";

import type {
  ToolCall,
  ToolResult,
  ModelRequest,
  Attachment,
  RequestBody,
  DocumentText,
  ProcessedAttachments,
  CustomToolDefinition,
  LovableAIResponse,
  ContentPart,
  MessageItem,
  UsageData,
  SuccessResult,
} from "./types.ts";

import {
  CORS_HEADERS,
  MAX_TOOL_ITERATIONS,
  MAX_DOCUMENT_TEXT_LENGTH,
  FETCH_TIMEOUT_MS,
  DOCUMENT_MIME_TYPES,
  THINKING_MODELS,
  THINKING_MODEL_TOKEN_MULTIPLIER,
  DEFAULT_PROMPTS,
  ANTHROPIC_MODEL_MAP,
} from "./constants.ts";

// ============================================
// Multimodal Content Builder
// ============================================

function buildMultimodalContent(message: string, attachments: Attachment[]): ContentPart[] {
  const content: ContentPart[] = [];
  
  if (message) {
    content.push({ type: "text", text: message });
  }
  
  for (const att of attachments) {
    if (att.type.startsWith('image/')) {
      content.push({
        type: "image_url",
        image_url: { url: att.url }
      });
    }
  }
  
  return content;
}

// ============================================
// Document Processing
// ============================================

async function fetchFileAsArrayBuffer(url: string): Promise<ArrayBuffer> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }
    return await response.arrayBuffer();
  } finally {
    clearTimeout(timeoutId);
  }
}

// PDF/DOCX extraction temporarily disabled
async function extractTextFromPDF(_buffer: ArrayBuffer): Promise<string> {
  console.warn("PDF extraction is temporarily disabled");
  return "[PDF extraction temporarily unavailable]";
}

async function extractTextFromDOCX(_buffer: ArrayBuffer): Promise<string> {
  console.warn("DOCX extraction is temporarily disabled");
  return "[DOCX extraction temporarily unavailable]";
}

async function processDocumentAttachments(attachments: Attachment[]): Promise<ProcessedAttachments> {
  const images: Attachment[] = [];
  const documentTexts: DocumentText[] = [];
  const errors: { name: string; error: string }[] = [];
  
  for (const att of attachments) {
    if (att.type.startsWith('image/')) {
      images.push(att);
      continue;
    }
    
    const docType = DOCUMENT_MIME_TYPES[att.type];
    if (!docType) {
      console.log(`Skipping unsupported file type: ${att.type} (${att.name})`);
      continue;
    }
    
    try {
      console.log(`Extracting text from ${docType}: ${att.name}`);
      const buffer = await fetchFileAsArrayBuffer(att.url);
      
      let text: string;
      if (docType === 'pdf') {
        text = await extractTextFromPDF(buffer);
      } else if (docType === 'docx') {
        text = await extractTextFromDOCX(buffer);
      } else {
        continue;
      }
      
      if (text.length > MAX_DOCUMENT_TEXT_LENGTH) {
        text = text.substring(0, MAX_DOCUMENT_TEXT_LENGTH) + '\n\n[... текст обрезан из-за превышения лимита ...]';
      }
      
      if (text.trim()) {
        documentTexts.push({ name: att.name, text: text.trim() });
        console.log(`Successfully extracted ${text.length} chars from ${att.name}`);
      } else {
        console.warn(`Empty text extracted from ${att.name}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error extracting text from ${att.name}:`, errorMessage);
      errors.push({ name: att.name, error: errorMessage });
    }
  }
  
  return { images, documentTexts, errors };
}

function buildEnhancedMessage(originalMessage: string, documentTexts: DocumentText[]): string {
  if (documentTexts.length === 0) {
    return originalMessage;
  }
  
  const documentSections = documentTexts.map(doc => 
    `--- Документ: ${doc.name} ---\n${doc.text}\n--- Конец документа ---`
  ).join('\n\n');
  
  return `Пользователь приложил следующие документы к своему запросу:\n\n${documentSections}\n\n=== Вопрос пользователя ===\n${originalMessage}`;
}

// ============================================
// Lovable AI API
// ============================================

async function callLovableAI(
  apiKey: string,
  model: string,
  message: string,
  attachments: Attachment[],
  systemPrompt: string,
  temperature: number,
  maxTokens: number,
  enableTools: boolean = true,
  enabledTools?: string[],
  customTools?: CustomToolDefinition[]
): Promise<LovableAIResponse> {
  const isOpenAI = model.startsWith("openai/");
  const tokenParam = isOpenAI 
    ? { max_completion_tokens: maxTokens }
    : { max_tokens: maxTokens };
  const tempParam = isOpenAI ? {} : { temperature };

  const imageAttachments = attachments.filter(a => a.type.startsWith('image/'));
  const userContent = imageAttachments.length > 0 
    ? buildMultimodalContent(message, attachments)
    : message;

  const messages: MessageItem[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ];

  if (customTools && customTools.length > 0) {
    registerCustomTools(customTools);
  }

  const allToolCalls: ToolCall[] = [];
  const allToolResults: ToolResult[] = [];
  let iteration = 0;
  let finalContent = "";
  let finalReasoning: string | null = null;
  let finalUsage: UsageData | null = null;

  while (iteration < MAX_TOOL_ITERATIONS) {
    iteration++;
    console.log(`[${model}] Tool calling iteration ${iteration}`);

    const requestBody: Record<string, unknown> = {
      model,
      messages,
      ...tempParam,
      ...tokenParam,
    };

    if (enableTools) {
      const allTools: typeof AVAILABLE_TOOLS = [];
      
      if (AVAILABLE_TOOLS.length > 0) {
        const filteredBuiltIn = enabledTools && enabledTools.length > 0
          ? AVAILABLE_TOOLS.filter(t => enabledTools.includes(t.function.name))
          : AVAILABLE_TOOLS;
        allTools.push(...filteredBuiltIn);
      }
      
      if (customTools && customTools.length > 0) {
        for (const ct of customTools) {
          const properties: Record<string, { type: string; description?: string }> = {};
          const required: string[] = [];
          
          for (const param of ct.parameters) {
            properties[param.name] = {
              type: param.type,
              description: param.description,
            };
            if (param.required) {
              required.push(param.name);
            }
          }
          
          allTools.push({
            type: "function",
            function: {
              name: `custom_${ct.name}`,
              description: ct.description,
              parameters: {
                type: "object",
                properties,
                required,
              },
            },
          });
        }
      }
      
      if (allTools.length > 0) {
        requestBody.tools = allTools;
        console.log(`[${model}] Tools enabled: ${allTools.map(t => t.function.name).join(', ')}`);
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw { status: 429, message: "Rate limit exceeded" };
      }
      if (response.status === 402) {
        throw { status: 402, message: "Payment required" };
      }
      const error = await response.text();
      throw new Error(`Lovable AI error: ${error}`);
    }

    const data = await response.json();
    console.log(`[${model}] Full API response (iteration ${iteration}):`, JSON.stringify(data, null, 2));
    
    const choice = data.choices?.[0];
    const messageResponse = choice?.message;
    const content = messageResponse?.content || "";
    const reasoning = messageResponse?.reasoning || null;
    const usage = data.usage || null;
    const toolCalls = messageResponse?.tool_calls as ToolCall[] | undefined;

    if (content) finalContent = content;
    if (reasoning) finalReasoning = reasoning;
    if (usage) finalUsage = usage;

    if (toolCalls && toolCalls.length > 0) {
      console.log(`[${model}] Model requested ${toolCalls.length} tool calls`);
      
      const results = await executeToolCalls(toolCalls);
      allToolCalls.push(...toolCalls);
      allToolResults.push(...results);
      
      messages.push({
        role: "assistant",
        content: content || null,
        tool_calls: toolCalls,
      });
      
      for (const result of results) {
        messages.push({
          role: "tool",
          tool_call_id: result.tool_call_id,
          content: result.content,
        });
      }
      
      continue;
    }
    
    break;
  }

  if (!finalContent) {
    console.warn(`[${model}] Empty content received after ${iteration} iterations`);
  }
  
  if (finalReasoning) {
    console.log(`[${model}] Reasoning captured: ${finalReasoning.length} chars`);
  }

  if (finalUsage) {
    console.log(`[${model}] Usage: prompt=${finalUsage.prompt_tokens}, completion=${finalUsage.completion_tokens}, total=${finalUsage.total_tokens}`);
  }

  if (allToolCalls.length > 0) {
    console.log(`[${model}] Total tool calls made: ${allToolCalls.length}`);
  }
  
  return {
    model,
    provider: "lovable",
    content: finalContent,
    reasoning: finalReasoning,
    usage: finalUsage,
    tool_calls: allToolCalls.length > 0 ? allToolCalls : undefined,
    tool_results: allToolResults.length > 0 ? allToolResults : undefined,
  };
}

// ============================================
// Personal Model APIs
// ============================================

async function callPersonalModel(
  provider: string,
  apiKey: string,
  model: string,
  message: string,
  attachments: Attachment[],
  systemPrompt: string,
  temperature: number,
  maxTokens: number
) {
  const imageAttachments = attachments.filter(a => a.type.startsWith('image/'));
  
  if (provider === "openai") {
    const userContent = imageAttachments.length > 0 
      ? buildMultimodalContent(message, attachments)
      : message;
      
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI error: ${await response.text()}`);
    const data = await response.json();
    return { 
      model, 
      provider: "openai", 
      content: data.choices?.[0]?.message?.content || "",
      usage: data.usage || null,
    };
  }

  if (provider === "gemini") {
    const parts: Array<{ text?: string; file_data?: { mime_type: string; file_uri: string } }> = [];
    parts.push({ text: `${systemPrompt}\n\nUser: ${message}` });
    
    for (const att of imageAttachments) {
      parts.push({
        file_data: {
          mime_type: att.type,
          file_uri: att.url
        }
      });
    }
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        }),
      }
    );

    if (!response.ok) throw new Error(`Gemini error: ${await response.text()}`);
    const data = await response.json();
    const usageMetadata = data.usageMetadata;
    return { 
      model: "gemini-1.5-pro", 
      provider: "gemini", 
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || "",
      usage: usageMetadata ? {
        prompt_tokens: usageMetadata.promptTokenCount || 0,
        completion_tokens: usageMetadata.candidatesTokenCount || 0,
        total_tokens: usageMetadata.totalTokenCount || 0,
      } : null,
    };
  }

  if (provider === "anthropic") {
    type AnthropicContent = 
      | string 
      | Array<{ type: "text"; text: string } | { type: "image"; source: { type: "url"; url: string } }>;
    
    let userContent: AnthropicContent;
    
    if (imageAttachments.length > 0) {
      const contentParts: Array<{ type: "text"; text: string } | { type: "image"; source: { type: "url"; url: string } }> = [];
      
      if (message) {
        contentParts.push({ type: "text", text: message });
      }
      
      for (const att of imageAttachments) {
        contentParts.push({
          type: "image",
          source: { type: "url", url: att.url }
        });
      }
      
      userContent = contentParts;
    } else {
      userContent = message;
    }
    
    const actualModel = ANTHROPIC_MODEL_MAP[model] || 'claude-3-5-sonnet-20241022';
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: actualModel,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
        temperature,
      }),
    });

    if (!response.ok) throw new Error(`Anthropic error: ${await response.text()}`);
    const data = await response.json();
    return { 
      model, 
      provider: "anthropic", 
      content: data.content?.[0]?.text || "",
      usage: data.usage ? {
        prompt_tokens: data.usage.input_tokens || 0,
        completion_tokens: data.usage.output_tokens || 0,
        total_tokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
      } : null,
    };
  }

  if (provider === "xai") {
    const userContent = imageAttachments.length > 0 
      ? buildMultimodalContent(message, attachments)
      : message;
      
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) throw new Error(`xAI error: ${await response.text()}`);
    const data = await response.json();
    return { 
      model, 
      provider: "xai", 
      content: data.choices?.[0]?.message?.content || "",
      usage: data.usage || null,
    };
  }

  if (provider === "openrouter") {
    const userContent = imageAttachments.length > 0 
      ? buildMultimodalContent(message, attachments)
      : message;
      
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ai-hydra.lovable.app",
        "X-Title": "Hydra AI",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Parse error to detect unavailable models
      let errorCode = response.status;
      let isModelUnavailable = false;
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.code) {
          errorCode = errorJson.error.code;
        }
        // Check for 404 "No endpoints found"
        if (errorCode === 404 || errorJson.error?.message?.includes('No endpoints found')) {
          isModelUnavailable = true;
        }
        // Check for 402 payment/limit errors
        if (errorCode === 402 || errorJson.error?.message?.includes('spend limit')) {
          isModelUnavailable = true;
        }
      } catch {
        // Error text is not JSON
      }
      
      // Throw structured error for client to handle
      throw {
        provider: "openrouter",
        model,
        status: response.status,
        code: errorCode,
        message: errorText,
        isModelUnavailable,
      };
    }
    const data = await response.json();
    return { 
      model, 
      provider: "openrouter", 
      content: data.choices?.[0]?.message?.content || "",
      usage: data.usage || null,
    };
  }

  if (provider === "groq") {
    const userContent = imageAttachments.length > 0 
      ? buildMultimodalContent(message, attachments)
      : message;
      
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq error: ${errorText}`);
    }
    const data = await response.json();
    return { 
      model, 
      provider: "groq", 
      content: data.choices?.[0]?.message?.content || "",
      usage: data.usage || null,
    };
  }

  // DeepSeek (OpenAI-compatible API)
  if (provider === "deepseek") {
    const userContent = imageAttachments.length > 0 
      ? buildMultimodalContent(message, attachments)
      : message;
    
    // DeepSeek-R1 is a reasoning model, handle reasoning_content
    const isReasoningModel = model === 'deepseek-reasoner';
      
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: isReasoningModel ? undefined : temperature, // R1 doesn't support temperature
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek error: ${errorText}`);
    }
    const data = await response.json();
    const messageResponse = data.choices?.[0]?.message;
    
    return { 
      model, 
      provider: "deepseek", 
      content: messageResponse?.content || "",
      reasoning: messageResponse?.reasoning_content || null, // R1 provides reasoning
      usage: data.usage || null,
    };
  }

  throw new Error(`Unknown provider: ${provider}`);
}

// ============================================
// Main Server Handler
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const requestBody: RequestBody = await req.json();
    
    // Handle HTTP tool testing action
    if (requestBody.action === 'test_http_tool') {
      const { http_config, test_args, tool_name } = requestBody;
      
      if (!http_config || !http_config.url) {
        return new Response(JSON.stringify({ success: false, error: 'http_config with url is required' }), {
          status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }
      
      console.log(`[Test HTTP Tool] Testing tool: ${tool_name || 'unnamed'}`);
      const result = await testHttpTool(http_config, test_args || {});
      
      return new Response(JSON.stringify(result), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    
    const { session_id, message, attachments, models } = requestBody;

    if (!session_id || !message || !models || models.length === 0) {
      return new Response(JSON.stringify({ error: "session_id, message, and models are required" }), {
        status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    
    const messageAttachments = attachments || [];

    // Process document attachments
    console.log(`Processing ${messageAttachments.length} attachments...`);
    const { images, documentTexts, errors: docErrors } = await processDocumentAttachments(messageAttachments);
    console.log(`Processed: ${images.length} images, ${documentTexts.length} document texts, ${docErrors.length} errors`);
    
    const enhancedMessage = buildEnhancedMessage(message, documentTexts);
    if (documentTexts.length > 0) {
      console.log(`Enhanced message length: ${enhancedMessage.length} chars`);
    }

    // Fetch user profile and API keys
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("user_id", user.id)
      .single();

    const { data: apiKeysResult } = await supabase.rpc('get_my_api_keys');
    const apiKeys = apiKeysResult?.[0] || null;

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const isAdmin = profile?.username === "AlexKuz";

    // Collect all custom tool IDs
    const allCustomToolIds = new Set<string>();
    for (const m of models) {
      if (m.enabled_custom_tools) {
        for (const id of m.enabled_custom_tools) {
          allCustomToolIds.add(id);
        }
      }
    }

    // Fetch custom tools from database
    let customToolsMap: Map<string, CustomToolDefinition> = new Map();
    if (allCustomToolIds.size > 0) {
      console.log(`Fetching ${allCustomToolIds.size} custom tools...`);
      const { data: customToolsData, error: customToolsError } = await supabase
        .from('custom_tools')
        .select('id, name, display_name, description, prompt_template, parameters, tool_type, http_config')
        .in('id', Array.from(allCustomToolIds));
      
      if (customToolsError) {
        console.error('Error fetching custom tools:', customToolsError);
      } else if (customToolsData) {
        for (const ct of customToolsData) {
          customToolsMap.set(ct.id, {
            id: ct.id,
            name: ct.name,
            display_name: ct.display_name,
            description: ct.description,
            prompt_template: ct.prompt_template,
            parameters: (ct.parameters as CustomToolDefinition['parameters']) || [],
            tool_type: (ct.tool_type || 'prompt') as 'prompt' | 'http_api',
            http_config: ct.http_config as CustomToolDefinition['http_config'],
          });
        }
        console.log(`Loaded ${customToolsMap.size} custom tools`);
      }
    }

    // Set user's search provider API keys (Tavily + Perplexity)
    const userTavilyKey = (apiKeys as { tavily_api_key?: string | null })?.tavily_api_key ?? null;
    const userPerplexityKey = (apiKeys as { perplexity_api_key?: string | null })?.perplexity_api_key ?? null;
    setSearchProviderKeys({ tavilyKey: userTavilyKey, perplexityKey: userPerplexityKey });
    
    const availableProviders = getAvailableSearchProviders();
    console.log(`[Tools] Search providers available: ${availableProviders} (Tavily: ${userTavilyKey ? 'personal' : 'system'}, Perplexity: ${userPerplexityKey ? 'personal' : 'none'})`);

    // Set execution context for session-aware tools (Archivist, Logistician)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    setExecutionContext({
      sessionId: session_id,
      userId: user.id,
      supabaseUrl,
      supabaseKey: supabaseServiceKey,
    });
    console.log(`[Tools] Execution context set for session: ${session_id}`);
    const errors: { model: string; error: string }[] = [];
    console.log(`Processing ${models.length} models:`, models.map(m => m.model_id));

    // Process all models in parallel
    const modelPromises = models.map(async (modelReq: ModelRequest) => {
      const temperature = modelReq.temperature ?? 0.7;
      const role = modelReq.role ?? 'assistant';
      const systemPrompt = modelReq.system_prompt || DEFAULT_PROMPTS[role] || DEFAULT_PROMPTS.assistant;

      const isThinkingModel = THINKING_MODELS.some(tm => modelReq.model_id.includes(tm));
      const baseMaxTokens = modelReq.max_tokens ?? 2048;
      const maxTokens = isThinkingModel 
        ? baseMaxTokens * THINKING_MODEL_TOKEN_MULTIPLIER 
        : baseMaxTokens;

      console.log(`Starting request for model: ${modelReq.model_id}, role: ${role}, temp: ${temperature}, maxTokens: ${maxTokens}${isThinkingModel ? ' (thinking model x4)' : ''}`);
      
      try {
        let result: { model: string; provider: string; content: string; reasoning?: string | null; usage?: UsageData | null; tool_calls?: ToolCall[]; tool_results?: ToolResult[] };
        
        if (modelReq.use_lovable_ai) {
          if (!isAdmin) {
            throw new Error("Lovable AI access restricted to admin only");
          }
          if (!lovableKey) {
            throw new Error("Lovable AI not configured");
          }
          
          const enableTools = modelReq.enable_tools !== false;
          const enabledTools = modelReq.enabled_tools;
          
          // Set model-specific search provider before calling
          if (modelReq.search_provider) {
            setSearchProviderKeys({
              tavilyKey: userTavilyKey,
              perplexityKey: userPerplexityKey,
              defaultProvider: modelReq.search_provider,
            });
          }
          
          const modelCustomTools: CustomToolDefinition[] = [];
          if (modelReq.enabled_custom_tools) {
            for (const ctId of modelReq.enabled_custom_tools) {
              const ct = customToolsMap.get(ctId);
              if (ct) {
                modelCustomTools.push(ct);
              }
            }
          }
          
          result = await callLovableAI(lovableKey, modelReq.model_id, enhancedMessage, images, systemPrompt, temperature, maxTokens, enableTools, enabledTools, modelCustomTools);
        } else {
          let apiKey: string | null = null;
          if (modelReq.provider === "openai") apiKey = apiKeys?.openai_api_key;
          if (modelReq.provider === "gemini") apiKey = apiKeys?.google_gemini_api_key;
          if (modelReq.provider === "anthropic") apiKey = apiKeys?.anthropic_api_key;
          if (modelReq.provider === "xai") apiKey = apiKeys?.xai_api_key;
          if (modelReq.provider === "openrouter") apiKey = (apiKeys as { openrouter_api_key?: string | null })?.openrouter_api_key ?? null;
          if (modelReq.provider === "groq") apiKey = (apiKeys as { groq_api_key?: string | null })?.groq_api_key ?? null;
          if (modelReq.provider === "deepseek") apiKey = (apiKeys as { deepseek_api_key?: string | null })?.deepseek_api_key ?? null;

          if (!apiKey) {
            throw new Error(`No API key configured for ${modelReq.provider}`);
          }

          result = await callPersonalModel(modelReq.provider!, apiKey, modelReq.model_id, enhancedMessage, images, systemPrompt, temperature, maxTokens);
        }
        
        console.log(`Success for model: ${modelReq.model_id}`);
        return { 
          ...result, 
          role,
          fallback_metadata: modelReq.fallback_metadata,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : (error as { message?: string })?.message || "Unknown error";
        console.error(`Error for model ${modelReq.model_id}:`, errorMessage);
        return { error: true, model: modelReq.model_id, message: errorMessage };
      }
    });

    const allResults = await Promise.all(modelPromises);
    console.log(`All results received: ${allResults.length}`);

    // Separate successes and errors
    const successResults: SuccessResult[] = [];
    for (const result of allResults) {
      if ('error' in result && result.error === true) {
        errors.push({ model: result.model, error: result.message });
      } else {
        successResults.push(result as SuccessResult);
      }
    }
    
    console.log(`Results: ${successResults.length} successes, ${errors.length} errors`);

    // Save all successful responses to database
    if (successResults.length > 0) {
      const messagesToInsert = successResults.map((result: SuccessResult & { fallback_metadata?: { used_fallback: boolean; fallback_reason: string } }) => ({
        session_id,
        user_id: user.id,
        role: result.role as 'assistant' | 'critic' | 'arbiter',
        model_name: result.model,
        content: result.content,
        reasoning_path: result.reasoning || null,
        metadata: { 
          provider: result.provider,
          prompt_tokens: result.usage?.prompt_tokens || 0,
          completion_tokens: result.usage?.completion_tokens || 0,
          total_tokens: result.usage?.total_tokens || 0,
          tool_calls: result.tool_calls || undefined,
          tool_results: result.tool_results || undefined,
          // Include fallback information if present
          used_fallback: result.fallback_metadata?.used_fallback || undefined,
          fallback_reason: result.fallback_metadata?.fallback_reason || undefined,
        },
      }));

      await supabase.from("messages").insert(messagesToInsert);

      // Update model statistics - increment response count for each model
      for (const result of successResults) {
        try {
          // Try to find existing stats for this user+model+session
          const { data: existingStats } = await supabase
            .from('model_statistics')
            .select('id, response_count')
            .eq('user_id', user.id)
            .eq('model_id', result.model)
            .eq('session_id', session_id)
            .maybeSingle();

          if (existingStats) {
            // Update existing record
            await supabase
              .from('model_statistics')
              .update({
                response_count: existingStats.response_count + 1,
                last_used_at: new Date().toISOString(),
              })
              .eq('id', existingStats.id);
          } else {
            // Insert new record
            await supabase
              .from('model_statistics')
              .insert({
                user_id: user.id,
                model_id: result.model,
                session_id: session_id,
                response_count: 1,
                first_used_at: new Date().toISOString(),
                last_used_at: new Date().toISOString(),
              });
          }
          console.log(`[Stats] Incremented response_count for ${result.model}`);
        } catch (statsError) {
          console.error(`[Stats] Error updating stats for ${result.model}:`, statsError);
        }
      }
    }

    // Combine document processing errors with model errors
    const allErrors = [
      ...docErrors.map(e => ({ model: `document:${e.name}`, error: e.error })),
      ...errors
    ];

    return new Response(JSON.stringify({ 
      success: true, 
      responses: successResults,
      documentTextsExtracted: documentTexts.length,
      errors: allErrors.length > 0 ? allErrors : undefined 
    }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Orchestrator error:", error);
    const status = (error as { status?: number })?.status || 500;
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
