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
 */
export const runMergeNode: NodeRunner = async (ctx) => {
  const { node, inputs } = ctx;
  const strategy = node.data.mergeStrategy || 'concat';

  let output: unknown;

  switch (strategy) {
    case 'concat':
      output = Object.values(inputs).filter(Boolean).join('\n\n');
      break;
    case 'array':
      output = Object.values(inputs).filter(Boolean);
      break;
    case 'object':
      output = { ...inputs };
      break;
    default:
      output = inputs;
  }

  ctx.sendEvent({
    type: 'node_progress',
    nodeId: node.id,
    data: { message: `Merged ${Object.keys(inputs).length} inputs (${strategy})` },
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
  // Checkpoint nodes use condition type but with waitForUser
};

/**
 * Gets the appropriate runner for a node type
 */
export function getNodeRunner(nodeType: string): NodeRunner | null {
  return nodeRunners[nodeType] || null;
}
