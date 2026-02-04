// ============================================
// Node Runners - Execute specific node types
// ============================================

import { NodeRunner, NodeRunnerContext, NodeRunnerResult } from "./types.ts";

/**
 * Input Node Runner
 * Entry point that passes through initial input or user data
 */
export const runInputNode: NodeRunner = async (ctx) => {
  const { node, flowContext } = ctx;
  const inputType = node.data.inputType || 'user';

  ctx.sendEvent({
    type: 'node_progress',
    nodeId: node.id,
    data: { message: `Processing ${inputType} input` },
  });

  // Get input from flow context
  const input = flowContext.input || flowContext.userMessage || '';

  return {
    success: true,
    output: input,
  };
};

/**
 * Prompt Node Runner
 * Retrieves and formats a prompt template
 */
export const runPromptNode: NodeRunner = async (ctx) => {
  const { node, inputs } = ctx;
  let promptContent = node.data.promptContent as string || '';

  // Substitute variables from inputs
  for (const [key, value] of Object.entries(inputs)) {
    promptContent = promptContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
  }

  ctx.sendEvent({
    type: 'node_progress',
    nodeId: node.id,
    data: { message: 'Prompt prepared', promptLength: promptContent.length },
  });

  return {
    success: true,
    output: promptContent,
  };
};

/**
 * Model Node Runner
 * Calls an AI model via Lovable AI gateway
 */
export const runModelNode: NodeRunner = async (ctx) => {
  const { node, inputs, lovableApiKey } = ctx;
  const modelName = node.data.modelName as string || 'openai/gpt-4o-mini';
  const temperature = node.data.temperature as number || 0.7;
  const maxTokens = node.data.maxTokens as number || 2048;

  // Collect all inputs as the prompt
  const prompt = Object.values(inputs).filter(Boolean).join('\n\n');

  if (!prompt) {
    return { success: false, error: 'No input provided to model node' };
  }

  ctx.sendEvent({
    type: 'node_progress',
    nodeId: node.id,
    data: { message: `Calling model: ${modelName}` },
  });

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: prompt }],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Model API error: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    ctx.sendEvent({
      type: 'node_progress',
      nodeId: node.id,
      data: { message: 'Model response received', tokens: data.usage?.total_tokens },
    });

    return {
      success: true,
      output: content,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Model call failed: ${errorMessage}` };
  }
};

/**
 * Condition Node Runner
 * Evaluates a condition and returns boolean result
 */
export const runConditionNode: NodeRunner = async (ctx) => {
  const { node, inputs } = ctx;
  const condition = node.data.condition as string || 'true';

  // Simple condition evaluation (for safety, we use a limited approach)
  const inputValue = Object.values(inputs)[0];
  let result = false;

  try {
    // Basic condition patterns
    if (condition === 'true') {
      result = true;
    } else if (condition === 'false') {
      result = false;
    } else if (condition.includes('contains')) {
      const match = condition.match(/contains\(['"](.+)['"]\)/);
      if (match && typeof inputValue === 'string') {
        result = inputValue.includes(match[1]);
      }
    } else if (condition.includes('length >')) {
      const match = condition.match(/length\s*>\s*(\d+)/);
      if (match && typeof inputValue === 'string') {
        result = inputValue.length > parseInt(match[1]);
      }
    } else {
      // Default: check if input is truthy
      result = Boolean(inputValue);
    }

    ctx.sendEvent({
      type: 'node_progress',
      nodeId: node.id,
      data: { message: `Condition evaluated: ${result}` },
    });

    return {
      success: true,
      output: { result, trueHandle: result ? inputValue : null, falseHandle: result ? null : inputValue },
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Condition evaluation failed: ${errorMessage}` };
  }
};

/**
 * Transform Node Runner
 * Transforms data using simple operations
 */
export const runTransformNode: NodeRunner = async (ctx) => {
  const { node, inputs } = ctx;
  const transformType = node.data.transformType || 'json';
  const expression = node.data.transformExpression as string || '';

  const input = Object.values(inputs)[0];

  try {
    let output: unknown;

    switch (transformType) {
      case 'json':
        if (typeof input === 'string') {
          output = JSON.parse(input);
        } else {
          output = JSON.stringify(input, null, 2);
        }
        break;
      case 'text':
        output = String(input);
        break;
      case 'format':
        // Simple template substitution
        output = expression.replace(/\{\{input\}\}/g, String(input));
        break;
      default:
        output = input;
    }

    ctx.sendEvent({
      type: 'node_progress',
      nodeId: node.id,
      data: { message: `Transform (${transformType}) completed` },
    });

    return { success: true, output };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Transform failed: ${errorMessage}` };
  }
};

/**
 * Split Node Runner
 * Splits data into multiple outputs for parallel processing
 * Supports two modes:
 * - distribute: Split array/string into parts
 * - duplicate: Send same data to all outputs
 */
export const runSplitNode: NodeRunner = async (ctx) => {
  const { node, inputs } = ctx;
  const splitKey = node.data.splitKey as string || '';
  const splitMode = node.data.splitMode as string || 'distribute';
  const outputCount = node.data.outputCount as number || 2;

  const input = Object.values(inputs)[0];

  ctx.sendEvent({
    type: 'node_progress',
    nodeId: node.id,
    data: { message: `Split mode: ${splitMode}, outputs: ${outputCount}` },
  });

  try {
    // Duplicate mode: same input to all outputs
    if (splitMode === 'duplicate') {
      const outputs: Record<string, unknown> = {};
      for (let i = 1; i <= outputCount; i++) {
        outputs[`output-${i}`] = input;
      }
      return { success: true, output: outputs };
    }

    // Distribute mode: split input across outputs
    let items: unknown[];
    
    if (Array.isArray(input)) {
      items = input;
    } else if (typeof input === 'string') {
      items = splitKey ? input.split(splitKey) : input.split('\n');
    } else if (typeof input === 'object' && input !== null) {
      items = Object.values(input);
    } else {
      items = [input];
    }

    // Distribute items across outputs
    const outputs: Record<string, unknown[]> = {};
    for (let i = 1; i <= outputCount; i++) {
      outputs[`output-${i}`] = [];
    }

    items.forEach((item, index) => {
      const outputIndex = (index % outputCount) + 1;
      (outputs[`output-${outputIndex}`] as unknown[]).push(item);
    });

    // If only one item per output, unwrap arrays
    const finalOutputs: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(outputs)) {
      finalOutputs[key] = (value as unknown[]).length === 1 
        ? (value as unknown[])[0] 
        : value;
    }

    ctx.sendEvent({
      type: 'node_progress',
      nodeId: node.id,
      data: { message: `Split ${items.length} items into ${outputCount} outputs` },
    });

    return { success: true, output: finalOutputs };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Split failed: ${errorMessage}` };
  }
};

/**
 * Database Node Runner
 * Performs database operations via Supabase
 */
export const runDatabaseNode: NodeRunner = async (ctx) => {
  const { node, inputs, supabaseClient } = ctx;
  const operation = node.data.dbOperation as string || 'read';
  const tableName = node.data.tableName as string || '';

  if (!tableName) {
    return { success: false, error: 'Table name is required' };
  }

  if (!supabaseClient) {
    return { success: false, error: 'Database client not available' };
  }

  ctx.sendEvent({
    type: 'node_progress',
    nodeId: node.id,
    data: { message: `${operation} on ${tableName}` },
  });

  try {
    const inputData = Object.values(inputs)[0];
    let result: unknown;

    switch (operation) {
      case 'read': {
        const { data, error } = await supabaseClient
          .from(tableName)
          .select('*')
          .limit(100);
        if (error) throw error;
        result = data;
        break;
      }
      case 'write': {
        if (!inputData) {
          return { success: false, error: 'No data to insert' };
        }
        const { data, error } = await supabaseClient
          .from(tableName)
          .insert(inputData as Record<string, unknown>)
          .select();
        if (error) throw error;
        result = data;
        break;
      }
      case 'update': {
        if (!inputData || typeof inputData !== 'object') {
          return { success: false, error: 'Update data must be an object with id' };
        }
        const { id, ...updateData } = inputData as Record<string, unknown>;
        const { data, error } = await supabaseClient
          .from(tableName)
          .update(updateData)
          .eq('id', id)
          .select();
        if (error) throw error;
        result = data;
        break;
      }
      case 'delete': {
        if (!inputData) {
          return { success: false, error: 'ID required for delete' };
        }
        const { error } = await supabaseClient
          .from(tableName)
          .delete()
          .eq('id', inputData);
        if (error) throw error;
        result = { deleted: true, id: inputData };
        break;
      }
      default:
        return { success: false, error: `Unknown operation: ${operation}` };
    }

    return { success: true, output: result };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Database ${operation} failed: ${errorMessage}` };
  }
};

/**
 * API Node Runner
 * Makes HTTP requests to external APIs
 */
export const runApiNode: NodeRunner = async (ctx) => {
  const { node, inputs } = ctx;
  const apiUrl = node.data.apiUrl as string || '';
  const method = (node.data.apiMethod as string || 'GET').toUpperCase();

  if (!apiUrl) {
    return { success: false, error: 'API URL is required' };
  }

  ctx.sendEvent({
    type: 'node_progress',
    nodeId: node.id,
    data: { message: `${method} ${apiUrl}` },
  });

  try {
    const inputData = Object.values(inputs)[0];
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (['POST', 'PUT', 'PATCH'].includes(method) && inputData) {
      fetchOptions.body = typeof inputData === 'string' 
        ? inputData 
        : JSON.stringify(inputData);
    }

    const response = await fetch(apiUrl, fetchOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      return { 
        success: false, 
        error: `API error ${response.status}: ${errorText.slice(0, 200)}` 
      };
    }

    const contentType = response.headers.get('content-type') || '';
    let result: unknown;

    if (contentType.includes('application/json')) {
      result = await response.json();
    } else {
      result = await response.text();
    }

    return { success: true, output: result };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: `API request failed: ${errorMessage}` };
  }
};

/**
 * Storage Node Runner
 * Reads/writes to file storage
 */
export const runStorageNode: NodeRunner = async (ctx) => {
  const { node, inputs, supabaseClient } = ctx;
  const storagePath = node.data.storagePath as string || '';
  const operation = node.data.storageOperation as string || 'read';

  if (!storagePath) {
    return { success: false, error: 'Storage path is required' };
  }

  if (!supabaseClient) {
    return { success: false, error: 'Storage client not available' };
  }

  // Parse bucket and path
  const [bucket, ...pathParts] = storagePath.split('/');
  const filePath = pathParts.join('/');

  if (!bucket || !filePath) {
    return { success: false, error: 'Invalid storage path format (bucket/path)' };
  }

  ctx.sendEvent({
    type: 'node_progress',
    nodeId: node.id,
    data: { message: `${operation} ${storagePath}` },
  });

  try {
    if (operation === 'read') {
      const { data, error } = await supabaseClient
        .storage
        .from(bucket)
        .download(filePath);
      
      if (error) throw error;
      const text = await data.text();
      return { success: true, output: text };
    } else if (operation === 'write') {
      const inputData = Object.values(inputs)[0];
      if (!inputData) {
        return { success: false, error: 'No data to write' };
      }

      const content = typeof inputData === 'string' 
        ? inputData 
        : JSON.stringify(inputData);
      
      const { error } = await supabaseClient
        .storage
        .from(bucket)
        .upload(filePath, content, { upsert: true });
      
      if (error) throw error;
      return { success: true, output: { path: storagePath, written: true } };
    }

    return { success: false, error: `Unknown storage operation: ${operation}` };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Storage ${operation} failed: ${errorMessage}` };
  }
};

/**
 * Loop Node Runner
 * Iterates over array data
 */
export const runLoopNode: NodeRunner = async (ctx) => {
  const { node, inputs } = ctx;
  const loopVariable = node.data.loopVariable as string || 'item';
  const maxIterations = node.data.maxIterations as number || 100;

  const input = Object.values(inputs)[0];
  
  if (!Array.isArray(input)) {
    return { 
      success: true, 
      output: { [loopVariable]: input, index: 0, isLast: true } 
    };
  }

  const items = input.slice(0, maxIterations);
  
  ctx.sendEvent({
    type: 'node_progress',
    nodeId: node.id,
    data: { message: `Looping over ${items.length} items` },
  });

  // Return array of loop contexts for parallel processing
  const loopOutputs = items.map((item, index) => ({
    [loopVariable]: item,
    index,
    isLast: index === items.length - 1,
  }));

  return { success: true, output: loopOutputs };
};

/**
 * Switch Node Runner
 * Multi-way branching based on cases
 */
export const runSwitchNode: NodeRunner = async (ctx) => {
  const { node, inputs } = ctx;
  const switchCases = node.data.switchCases as Array<{ label: string; condition: string }> || [];

  const input = Object.values(inputs)[0];
  const inputStr = String(input);

  ctx.sendEvent({
    type: 'node_progress',
    nodeId: node.id,
    data: { message: `Evaluating ${switchCases.length} cases` },
  });

  // Find matching case
  for (const switchCase of switchCases) {
    let matches = false;

    // Simple pattern matching
    if (switchCase.condition === 'default') {
      matches = true;
    } else if (switchCase.condition.startsWith('contains:')) {
      const searchTerm = switchCase.condition.replace('contains:', '').trim();
      matches = inputStr.includes(searchTerm);
    } else if (switchCase.condition.startsWith('equals:')) {
      const value = switchCase.condition.replace('equals:', '').trim();
      matches = inputStr === value;
    } else if (switchCase.condition.startsWith('regex:')) {
      const pattern = switchCase.condition.replace('regex:', '').trim();
      matches = new RegExp(pattern).test(inputStr);
    } else {
      // Direct comparison
      matches = inputStr === switchCase.condition;
    }

    if (matches) {
      return {
        success: true,
        output: {
          matchedCase: switchCase.label,
          value: input,
        },
      };
    }
  }

  // No match - return default
  return {
    success: true,
    output: {
      matchedCase: 'default',
      value: input,
    },
  };
};

/**
 * Embedding Node Runner
 * Generates vector embeddings for text
 */
export const runEmbeddingNode: NodeRunner = async (ctx) => {
  const { node, inputs, lovableApiKey } = ctx;
  const embeddingModel = node.data.embeddingModel as string || 'text-embedding-3-small';

  const input = Object.values(inputs)[0];
  const text = typeof input === 'string' ? input : JSON.stringify(input);

  if (!text) {
    return { success: false, error: 'No text provided for embedding' };
  }

  ctx.sendEvent({
    type: 'node_progress',
    nodeId: node.id,
    data: { message: `Generating embedding with ${embeddingModel}` },
  });

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: embeddingModel,
        input: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Embedding API error: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    const embedding = data.data?.[0]?.embedding;

    if (!embedding) {
      return { success: false, error: 'No embedding returned from API' };
    }

    return {
      success: true,
      output: {
        text,
        embedding,
        dimensions: embedding.length,
      },
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Embedding generation failed: ${errorMessage}` };
  }
};

/**
 * Memory Node Runner
 * Retrieves or stores context in memory
 */
export const runMemoryNode: NodeRunner = async (ctx) => {
  const { node, inputs, supabaseClient, flowContext } = ctx;
  const memoryType = node.data.memoryType as string || 'short';

  const input = Object.values(inputs)[0];

  ctx.sendEvent({
    type: 'node_progress',
    nodeId: node.id,
    data: { message: `Memory operation (${memoryType})` },
  });

  try {
    if (memoryType === 'short') {
      // Short-term memory: just pass through with context enrichment
      return {
        success: true,
        output: {
          current: input,
          context: flowContext,
        },
      };
    }

    if (memoryType === 'long' && supabaseClient) {
      // Long-term memory: store in session_memory table
      const content = typeof input === 'string' ? input : JSON.stringify(input);
      
      const { data, error } = await supabaseClient
        .from('session_memory')
        .insert({
          session_id: flowContext.sessionId,
          user_id: flowContext.userId,
          content,
          chunk_type: 'flow_memory',
          metadata: { nodeId: node.id, timestamp: new Date().toISOString() },
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        success: true,
        output: {
          stored: true,
          memoryId: data.id,
          content,
        },
      };
    }

    if (memoryType === 'rag') {
      // RAG memory: would require embedding search
      // For now, pass through with a note
      return {
        success: true,
        output: {
          current: input,
          ragEnabled: false,
          note: 'RAG memory requires embedding integration',
        },
      };
    }

    return { success: true, output: input };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Memory operation failed: ${errorMessage}` };
  }
};

/**
 * Classifier Node Runner
 * Classifies input into predefined labels
 */
export const runClassifierNode: NodeRunner = async (ctx) => {
  const { node, inputs, lovableApiKey } = ctx;
  const labels = node.data.classifierLabels as string[] || ['positive', 'negative', 'neutral'];

  const input = Object.values(inputs)[0];
  const text = typeof input === 'string' ? input : JSON.stringify(input);

  if (!text) {
    return { success: false, error: 'No text provided for classification' };
  }

  ctx.sendEvent({
    type: 'node_progress',
    nodeId: node.id,
    data: { message: `Classifying into ${labels.length} labels` },
  });

  try {
    const prompt = `Classify the following text into one of these categories: ${labels.join(', ')}

Text: "${text}"

Respond with ONLY the category name, nothing else.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Classifier API error: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    const classification = data.choices?.[0]?.message?.content?.trim() || 'unknown';

    // Validate classification is in labels
    const normalizedClass = labels.find(
      l => l.toLowerCase() === classification.toLowerCase()
    ) || classification;

    return {
      success: true,
      output: {
        text,
        classification: normalizedClass,
        confidence: labels.includes(normalizedClass) ? 1.0 : 0.5,
        availableLabels: labels,
      },
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Classification failed: ${errorMessage}` };
  }
};

/**
 * Output Node Runner
 * Terminal node that collects final output
 */
export const runOutputNode: NodeRunner = async (ctx) => {
  const { node, inputs } = ctx;
  const outputType = node.data.outputType || 'chat';

  // Collect all inputs as final output
  const output = Object.values(inputs).length === 1
    ? Object.values(inputs)[0]
    : inputs;

  ctx.sendEvent({
    type: 'node_progress',
    nodeId: node.id,
    data: { message: `Output ready (${outputType})`, preview: String(output).slice(0, 100) },
  });

  return {
    success: true,
    output,
  };
};

/**
 * Delay Node Runner
 * Pauses execution for a specified time
 */
export const runDelayNode: NodeRunner = async (ctx) => {
  const { node, inputs } = ctx;
  const delayMs = node.data.delayMs as number || 1000;

  ctx.sendEvent({
    type: 'node_progress',
    nodeId: node.id,
    data: { message: `Waiting ${delayMs}ms` },
  });

  await new Promise(resolve => setTimeout(resolve, delayMs));

  return {
    success: true,
    output: Object.values(inputs)[0] || null,
  };
};

/**
 * Checkpoint Node (Condition with user approval)
 * Pauses execution and waits for user confirmation
 */
export const runCheckpointNode: NodeRunner = async (ctx) => {
  const { node, inputs, flowContext } = ctx;
  const checkpointMessage = node.data.checkpointMessage as string 
    || node.data.label as string 
    || 'Approval required to continue';

  // Check if we have a checkpoint response in context
  const checkpointResponse = flowContext[`checkpoint_${node.id}`] as { approved: boolean; user_input?: string } | undefined;

  if (checkpointResponse) {
    // We have a response, continue execution
    if (checkpointResponse.approved) {
      return {
        success: true,
        output: checkpointResponse.user_input || Object.values(inputs)[0],
      };
    } else {
      return {
        success: false,
        error: 'Checkpoint rejected by user',
      };
    }
  }

  // No response yet, pause and wait for user
  ctx.sendEvent({
    type: 'checkpoint',
    nodeId: node.id,
    data: { 
      message: checkpointMessage,
      inputPreview: String(Object.values(inputs)[0] || '').slice(0, 200),
    },
  });

  return {
    success: true,
    waitForUser: true,
    checkpointMessage,
  };
};

/**
 * Merge Node Runner
 * Combines multiple inputs into one output
 * Used after Split for parallel processing patterns
 */
export const runMergeNode: NodeRunner = async (ctx) => {
  const { node, inputs } = ctx;
  const strategy = node.data.mergeStrategy as string || 'concat';
  const waitForAll = node.data.waitForAll !== false;

  // Get all non-null inputs
  const inputValues = Object.entries(inputs)
    .filter(([_, v]) => v !== null && v !== undefined)
    .sort(([a], [b]) => {
      // Sort by input handle number for consistent ordering
      const numA = parseInt(a.replace('input-', '')) || 0;
      const numB = parseInt(b.replace('input-', '')) || 0;
      return numA - numB;
    })
    .map(([_, v]) => v);

  ctx.sendEvent({
    type: 'node_progress',
    nodeId: node.id,
    data: { 
      message: `Merging ${inputValues.length} inputs (${strategy})`,
      waitForAll,
    },
  });

  let output: unknown;

  switch (strategy) {
    case 'concat':
      // Concatenate all inputs as strings
      output = inputValues
        .map(v => typeof v === 'string' ? v : JSON.stringify(v))
        .join('\n\n');
      break;
      
    case 'array':
      // Combine into flat array
      output = inputValues.flatMap(v => Array.isArray(v) ? v : [v]);
      break;
      
    case 'object':
      // Merge into object with input keys
      output = Object.fromEntries(
        Object.entries(inputs).filter(([_, v]) => v !== null && v !== undefined)
      );
      break;
      
    case 'first':
      // Take first non-null value
      output = inputValues[0] ?? null;
      break;
      
    case 'last':
      // Take last non-null value
      output = inputValues[inputValues.length - 1] ?? null;
      break;
      
    default:
      output = inputValues;
  }

  ctx.sendEvent({
    type: 'node_progress',
    nodeId: node.id,
    data: { message: `Merged ${inputValues.length} inputs successfully` },
  });

  return { success: true, output };
};

/**
 * Filter Node Runner
 * Filters data based on a condition
 */
export const runFilterNode: NodeRunner = async (ctx) => {
  const { node, inputs } = ctx;
  const filterCondition = node.data.filterCondition as string || '';

  const input = Object.values(inputs)[0];

  // For arrays, filter elements; for strings, check condition
  if (Array.isArray(input)) {
    // Simple length filter
    const output = input.filter(item => {
      if (filterCondition.includes('length >')) {
        const match = filterCondition.match(/length\s*>\s*(\d+)/);
        if (match) {
          return String(item).length > parseInt(match[1]);
        }
      }
      return Boolean(item);
    });
    return { success: true, output };
  }

  // Pass through if condition is met
  const passes = filterCondition ? String(input).includes(filterCondition) : Boolean(input);
  
  return {
    success: true,
    output: passes ? input : null,
  };
};

/**
 * Registry of all node runners
 */
export const nodeRunners: Record<string, NodeRunner> = {
  input: runInputNode,
  prompt: runPromptNode,
  model: runModelNode,
  condition: runConditionNode,
  transform: runTransformNode,
  output: runOutputNode,
  delay: runDelayNode,
  merge: runMergeNode,
  filter: runFilterNode,
  split: runSplitNode,
  database: runDatabaseNode,
  api: runApiNode,
  storage: runStorageNode,
  loop: runLoopNode,
  switch: runSwitchNode,
  embedding: runEmbeddingNode,
  memory: runMemoryNode,
  classifier: runClassifierNode,
};

/**
 * Gets the appropriate runner for a node type
 */
export function getNodeRunner(nodeType: string): NodeRunner | null {
  return nodeRunners[nodeType] || null;
}
