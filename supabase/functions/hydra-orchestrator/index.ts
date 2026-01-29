import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AVAILABLE_TOOLS, executeToolCalls, ToolCall, ToolResult, registerCustomTools } from "./tools.ts";
// Note: PDF/DOCX extraction temporarily disabled due to esm.sh issues
// import { getDocument } from "https://esm.sh/pdfjs-serverless";
// import mammoth from "https://esm.sh/mammoth@1.6.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Maximum iterations for tool calling loop (prevent infinite loops)
const MAX_TOOL_ITERATIONS = 5;

interface ModelRequest {
  model_id: string;
  use_lovable_ai: boolean;
  provider?: string | null;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
  role?: 'assistant' | 'critic' | 'arbiter';
  enable_tools?: boolean;
  enabled_tools?: string[]; // Built-in tools enabled for this model
  enabled_custom_tools?: string[]; // Custom tool IDs enabled for this model
}

interface CustomToolDef {
  id: string;
  name: string;
  display_name: string;
  description: string;
  prompt_template: string;
  parameters: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean';
    description: string;
    required: boolean;
  }>;
  tool_type: 'prompt' | 'http_api';
  http_config: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body_template?: string;
    response_path?: string;
  } | null;
}

interface Attachment {
  name: string;
  url: string;
  type: string;
}

interface RequestBody {
  session_id: string;
  message: string;
  attachments?: Attachment[];
  models: ModelRequest[];
}

interface DocumentText {
  name: string;
  text: string;
}

interface ProcessedAttachments {
  images: Attachment[];
  documentTexts: DocumentText[];
  errors: { name: string; error: string }[];
}

// Constants for document processing
const MAX_DOCUMENT_TEXT_LENGTH = 50000;
const FETCH_TIMEOUT_MS = 30000;

const DOCUMENT_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

// Thinking models that use reasoning tokens (need higher limits)
const THINKING_MODELS = [
  'google/gemini-2.5-pro',
  'google/gemini-3-pro-preview',
  'openai/gpt-5',
  'openai/gpt-5.2',
];

// Multiplier for thinking models (reasoning consumes ~80-90% of tokens)
const THINKING_MODEL_TOKEN_MULTIPLIER = 4;

// Helper to build multimodal content for OpenAI-compatible APIs
type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

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

// Fetch file from URL with timeout
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

// Extract text from PDF - temporarily disabled
async function extractTextFromPDF(_buffer: ArrayBuffer): Promise<string> {
  // PDF extraction temporarily disabled due to esm.sh import issues
  console.warn("PDF extraction is temporarily disabled");
  return "[PDF extraction temporarily unavailable]";
}

// Extract text from DOCX - temporarily disabled
async function extractTextFromDOCX(_buffer: ArrayBuffer): Promise<string> {
  // DOCX extraction temporarily disabled due to esm.sh import issues
  console.warn("DOCX extraction is temporarily disabled");
  return "[DOCX extraction temporarily unavailable]";
}

// Process all attachments: separate images and extract text from documents
async function processDocumentAttachments(attachments: Attachment[]): Promise<ProcessedAttachments> {
  const images: Attachment[] = [];
  const documentTexts: DocumentText[] = [];
  const errors: { name: string; error: string }[] = [];
  
  for (const att of attachments) {
    // Handle images as-is for multimodal
    if (att.type.startsWith('image/')) {
      images.push(att);
      continue;
    }
    
    // Check if it's a supported document type
    const docType = DOCUMENT_MIME_TYPES[att.type];
    if (!docType) {
      console.log(`Skipping unsupported file type: ${att.type} (${att.name})`);
      continue;
    }
    
    try {
      console.log(`Extracting text from ${docType}: ${att.name}`);
      
      // Fetch the file
      const buffer = await fetchFileAsArrayBuffer(att.url);
      
      // Extract text based on type
      let text: string;
      if (docType === 'pdf') {
        text = await extractTextFromPDF(buffer);
      } else if (docType === 'docx') {
        text = await extractTextFromDOCX(buffer);
      } else {
        continue;
      }
      
      // Truncate if too long
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

// Build enhanced message with document texts prepended
function buildEnhancedMessage(
  originalMessage: string,
  documentTexts: DocumentText[]
): string {
  if (documentTexts.length === 0) {
    return originalMessage;
  }
  
  const documentSections = documentTexts.map(doc => 
    `--- Документ: ${doc.name} ---\n${doc.text}\n--- Конец документа ---`
  ).join('\n\n');
  
  return `Пользователь приложил следующие документы к своему запросу:\n\n${documentSections}\n\n=== Вопрос пользователя ===\n${originalMessage}`;
}

async function callLovableAI(
  apiKey: string,
  model: string,
  message: string,
  attachments: Attachment[],
  systemPrompt: string,
  temperature: number,
  maxTokens: number,
  enableTools: boolean = true,
  enabledTools?: string[], // Built-in tools enabled for this model
  customTools?: CustomToolDef[] // Custom tools enabled for this model
): Promise<{
  model: string;
  provider: string;
  content: string;
  reasoning: string | null;
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null;
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
}> {
  // OpenAI models use max_completion_tokens, others use max_tokens
  const isOpenAI = model.startsWith("openai/");
  const tokenParam = isOpenAI 
    ? { max_completion_tokens: maxTokens }
    : { max_tokens: maxTokens };

  // OpenAI models via Lovable AI don't support custom temperature
  const tempParam = isOpenAI ? {} : { temperature };

  // Build user content: multimodal if images, plain text otherwise
  const imageAttachments = attachments.filter(a => a.type.startsWith('image/'));
  const userContent = imageAttachments.length > 0 
    ? buildMultimodalContent(message, attachments)
    : message;

  // Prepare messages array for the conversation
  type MessageItem = 
    | { role: "system"; content: string }
    | { role: "user"; content: string | ContentPart[] }
    | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
    | { role: "tool"; tool_call_id: string; content: string };

  const messages: MessageItem[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ];

  // Register custom tools for this request
  if (customTools && customTools.length > 0) {
    registerCustomTools(customTools);
  }

  // Track all tool calls and results across iterations
  const allToolCalls: ToolCall[] = [];
  const allToolResults: ToolResult[] = [];
  let iteration = 0;
  let finalContent = "";
  let finalReasoning: string | null = null;
  let finalUsage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null = null;

  while (iteration < MAX_TOOL_ITERATIONS) {
    iteration++;
    console.log(`[${model}] Tool calling iteration ${iteration}`);

    const requestBody: Record<string, unknown> = {
      model,
      messages,
      ...tempParam,
      ...tokenParam,
    };

    // Add tools only if enabled (filter by enabledTools if provided)
    if (enableTools) {
      const allTools: typeof AVAILABLE_TOOLS = [];
      
      // Add built-in tools
      if (AVAILABLE_TOOLS.length > 0) {
        const filteredBuiltIn = enabledTools && enabledTools.length > 0
          ? AVAILABLE_TOOLS.filter(t => enabledTools.includes(t.function.name))
          : AVAILABLE_TOOLS;
        allTools.push(...filteredBuiltIn);
      }
      
      // Add custom tools (convert to OpenAI tool format)
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
    
    // Log full response for debugging
    console.log(`[${model}] Full API response (iteration ${iteration}):`, JSON.stringify(data, null, 2));
    
    const choice = data.choices?.[0];
    const messageResponse = choice?.message;
    const content = messageResponse?.content || "";
    const reasoning = messageResponse?.reasoning || null;
    const usage = data.usage || null;
    const toolCalls = messageResponse?.tool_calls as ToolCall[] | undefined;

    // Update final values
    if (content) {
      finalContent = content;
    }
    if (reasoning) {
      finalReasoning = reasoning;
    }
    if (usage) {
      finalUsage = usage;
    }

    // Check if model wants to call tools
    if (toolCalls && toolCalls.length > 0) {
      console.log(`[${model}] Model requested ${toolCalls.length} tool calls`);
      
      // Execute all tool calls
      const results = await executeToolCalls(toolCalls);
      
      // Store for metadata
      allToolCalls.push(...toolCalls);
      allToolResults.push(...results);
      
      // Add assistant message with tool calls to conversation
      messages.push({
        role: "assistant",
        content: content || null,
        tool_calls: toolCalls,
      });
      
      // Add tool results to conversation
      for (const result of results) {
        messages.push({
          role: "tool",
          tool_call_id: result.tool_call_id,
          content: result.content,
        });
      }
      
      // Continue loop to get final response
      continue;
    }
    
    // No tool calls - we have the final response
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
    // OpenAI uses image_url format
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
    // Gemini uses inline_data for images (requires base64) or fileData
    // For URLs, we'll pass them as file_data with uri
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
    // Gemini returns usageMetadata instead of usage
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
    // Anthropic uses source.url for images
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
    
    // Map model IDs to actual Anthropic model names
    const anthropicModelMap: Record<string, string> = {
      'claude-3-5-sonnet': 'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku': 'claude-3-5-haiku-20241022',
      'claude-3-opus': 'claude-3-opus-20240229',
      'claude-3-haiku': 'claude-3-haiku-20240307',
    };
    const actualModel = anthropicModelMap[model] || 'claude-3-5-sonnet-20241022';
    
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
    // Anthropic returns usage in a similar format
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
    // xAI Grok uses OpenAI-compatible API
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

  throw new Error(`Unknown provider: ${provider}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const requestBody = await req.json();
    
    // Handle HTTP tool testing action
    if (requestBody.action === 'test_http_tool') {
      const { http_config, test_args, tool_name } = requestBody;
      
      if (!http_config || !http_config.url) {
        return new Response(JSON.stringify({ success: false, error: 'http_config with url is required' }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      console.log(`[Test HTTP Tool] Testing tool: ${tool_name || 'unnamed'}`);
      
      // Import and use the HTTP execution function
      const { testHttpTool } = await import("./tools.ts");
      const result = await testHttpTool(http_config, test_args || {});
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const { session_id, message, attachments, models }: RequestBody = requestBody;

    if (!session_id || !message || !models || models.length === 0) {
      return new Response(JSON.stringify({ error: "session_id, message, and models are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Default to empty array if no attachments provided
    const messageAttachments = attachments || [];

    // Process document attachments: extract text from PDF/DOCX, keep images for multimodal
    console.log(`Processing ${messageAttachments.length} attachments...`);
    const { images, documentTexts, errors: docErrors } = await processDocumentAttachments(messageAttachments);
    console.log(`Processed: ${images.length} images, ${documentTexts.length} document texts, ${docErrors.length} errors`);
    
    // Build enhanced message with document texts
    const enhancedMessage = buildEnhancedMessage(message, documentTexts);
    if (documentTexts.length > 0) {
      console.log(`Enhanced message length: ${enhancedMessage.length} chars`);
    }

    // Fetch username from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("user_id", user.id)
      .single();

    // Fetch decrypted API keys from Vault via RPC
    const { data: apiKeysResult } = await supabase.rpc('get_my_api_keys');
    const apiKeys = apiKeysResult?.[0] || null;

    // Default system prompts for each role
    const defaultPrompts: Record<string, string> = {
      assistant: `You are an expert participating in a multi-agent discussion. Provide clear, well-reasoned responses. Be concise but thorough. Your perspective may differ from other AI models in this conversation.`,
      critic: `You are a critical analyst. Your task is to find weaknesses, contradictions, and potential problems in reasoning. Be constructive but rigorous. Challenge assumptions and identify logical flaws.`,
      arbiter: `You are a discussion arbiter. Synthesize different viewpoints, highlight consensus and disagreements. Form a balanced final decision based on the merits of each argument.`,
    };

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const isAdmin = profile?.username === "AlexKuz";

    // Collect all custom tool IDs needed across all models
    const allCustomToolIds = new Set<string>();
    for (const m of models) {
      if (m.enabled_custom_tools) {
        for (const id of m.enabled_custom_tools) {
          allCustomToolIds.add(id);
        }
      }
    }

    // Fetch custom tools from database if any are enabled
    let customToolsMap: Map<string, CustomToolDef> = new Map();
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
            parameters: (ct.parameters as CustomToolDef['parameters']) || [],
            tool_type: (ct.tool_type || 'prompt') as 'prompt' | 'http_api',
            http_config: ct.http_config as CustomToolDef['http_config'],
          });
        }
        console.log(`Loaded ${customToolsMap.size} custom tools`);
      }
    }

    const errors: { model: string; error: string }[] = [];

    console.log(`Processing ${models.length} models:`, models.map(m => m.model_id));

    // Process all models in parallel with individual settings
    const modelPromises = models.map(async (modelReq) => {
      // Use per-model settings or defaults
      const temperature = modelReq.temperature ?? 0.7;
      const role = modelReq.role ?? 'assistant';
      const systemPrompt = modelReq.system_prompt || defaultPrompts[role] || defaultPrompts.assistant;

      // Check if this is a thinking model that needs more tokens
      const isThinkingModel = THINKING_MODELS.some(tm => modelReq.model_id.includes(tm));
      const baseMaxTokens = modelReq.max_tokens ?? 2048;
      const maxTokens = isThinkingModel 
        ? baseMaxTokens * THINKING_MODEL_TOKEN_MULTIPLIER 
        : baseMaxTokens;

      console.log(`Starting request for model: ${modelReq.model_id}, role: ${role}, temp: ${temperature}, maxTokens: ${maxTokens}${isThinkingModel ? ' (thinking model x4)' : ''}`);
      
      try {
        let result: { model: string; provider: string; content: string };
        
        if (modelReq.use_lovable_ai) {
          // Check if user is admin
          if (!isAdmin) {
            throw new Error("Lovable AI access restricted to admin only");
          }
          if (!lovableKey) {
            throw new Error("Lovable AI not configured");
          }
          // Use enhanced message (with document texts) and images for multimodal
          const enableTools = modelReq.enable_tools !== false; // Default to true
          const enabledTools = modelReq.enabled_tools;
          
          // Get custom tools for this model
          const modelCustomTools: CustomToolDef[] = [];
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
          // Use personal API key
          let apiKey: string | null = null;
          if (modelReq.provider === "openai") apiKey = apiKeys?.openai_api_key;
          if (modelReq.provider === "gemini") apiKey = apiKeys?.google_gemini_api_key;
          if (modelReq.provider === "anthropic") apiKey = apiKeys?.anthropic_api_key;
          if (modelReq.provider === "xai") apiKey = apiKeys?.xai_api_key;

          if (!apiKey) {
            throw new Error(`No API key configured for ${modelReq.provider}`);
          }

          // Use enhanced message (with document texts) and images for multimodal
          result = await callPersonalModel(modelReq.provider!, apiKey, modelReq.model_id, enhancedMessage, images, systemPrompt, temperature, maxTokens);
        }
        
        console.log(`Success for model: ${modelReq.model_id}`);
        return { ...result, role }; // Include role in result for DB insert
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : (error as { message?: string })?.message || "Unknown error";
        console.error(`Error for model ${modelReq.model_id}:`, errorMessage);
        return { error: true, model: modelReq.model_id, message: errorMessage };
      }
    });

    const allResults = await Promise.all(modelPromises);
    console.log(`All results received: ${allResults.length}`);

    // Separate successes and errors
    interface UsageData {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    }
    
    interface SuccessResult {
      model: string;
      provider: string;
      content: string;
      role: string;
      reasoning?: string | null;
      usage?: UsageData | null;
      tool_calls?: ToolCall[];
      tool_results?: ToolResult[];
    }
    
    const successResults: SuccessResult[] = [];
    for (const result of allResults) {
      if ('error' in result && result.error === true) {
        errors.push({ model: result.model, error: result.message });
      } else {
        successResults.push(result as SuccessResult);
      }
    }
    
    console.log(`Results: ${successResults.length} successes, ${errors.length} errors`);

    // Save all successful responses to database with individual roles, usage data, and tool calls
    if (successResults.length > 0) {
      const messagesToInsert = successResults.map(result => ({
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
          // Tool calling data
          tool_calls: result.tool_calls || undefined,
          tool_results: result.tool_results || undefined,
        },
      }));

      await supabase.from("messages").insert(messagesToInsert);
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Orchestrator error:", error);
    const status = (error as { status?: number })?.status || 500;
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
