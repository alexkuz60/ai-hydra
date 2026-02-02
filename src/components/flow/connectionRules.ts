import { FlowNodeType } from '@/types/flow';
import { FlowDataType } from '@/types/edgeTypes';

/**
 * Connection rules define which node types can connect to which targets.
 * Key = source node type
 * Value = array of allowed target node types
 */
export const CONNECTION_RULES: Record<FlowNodeType, FlowNodeType[] | 'any'> = {
  // Basic nodes
  input: ['prompt', 'model', 'transform', 'filter', 'merge', 'split', 'embedding', 'delay', 'loop'],
  prompt: ['model'],
  model: ['condition', 'output', 'transform', 'filter', 'memory', 'classifier', 'switch', 'delay', 'loop'],
  condition: 'any', // Multiple outputs allowed
  tool: ['model', 'output', 'transform', 'filter'],
  output: [], // Output nodes cannot have outgoing connections
  
  // Data processing
  transform: 'any',
  filter: 'any',
  merge: 'any',
  split: 'any', // Multiple outputs allowed
  
  // Integrations
  database: ['transform', 'output', 'model', 'filter', 'merge'],
  api: ['transform', 'output', 'model', 'filter', 'merge'],
  storage: ['transform', 'output', 'filter'],
  
  // Logic & control
  loop: 'any', // Can loop to any node
  delay: 'any',
  switch: 'any', // Multiple outputs allowed
  
  // AI-specific
  embedding: ['memory', 'model', 'output', 'transform', 'filter'],
  memory: ['model', 'output', 'transform'],
  classifier: ['condition', 'switch', 'output', 'transform'],
  
  // Grouping (groups don't connect - they contain nodes)
  group: [],
};

/**
 * Nodes that can accept incoming connections from any type
 * (except those explicitly restricted)
 */
export const UNIVERSAL_TARGETS: FlowNodeType[] = [
  'transform', 'filter', 'merge', 'delay', 'loop', 'output'
];

/**
 * Nodes that can ONLY receive connections from specific sources
 */
export const RESTRICTED_TARGETS: Partial<Record<FlowNodeType, FlowNodeType[]>> = {
  output: ['model', 'transform', 'api', 'database', 'storage', 'tool', 'classifier', 'filter', 'memory', 'embedding'],
  model: ['input', 'prompt', 'transform', 'tool', 'memory', 'database', 'api', 'filter', 'merge'],
  prompt: ['input', 'transform', 'database', 'api', 'storage'],
};

/**
 * Default data types produced by each node type
 */
export const NODE_OUTPUT_TYPES: Partial<Record<FlowNodeType, FlowDataType>> = {
  input: 'any',
  prompt: 'text',
  model: 'text',
  transform: 'any',
  filter: 'any',
  merge: 'any',
  split: 'any',
  database: 'json',
  api: 'json',
  storage: 'file',
  embedding: 'json',
  memory: 'json',
  classifier: 'json',
  tool: 'any',
  condition: 'signal',
  switch: 'signal',
  loop: 'signal',
  delay: 'signal',
  output: 'any',
};

export interface ConnectionValidationResult {
  isValid: boolean;
  reason?: string;
  reasonRu?: string;
}

/**
 * Validates if a connection between two node types is allowed
 */
export function validateConnection(
  sourceType: FlowNodeType,
  targetType: FlowNodeType
): ConnectionValidationResult {
  // Output nodes cannot have outgoing connections
  if (sourceType === 'output') {
    return {
      isValid: false,
      reason: 'Output nodes cannot have outgoing connections',
      reasonRu: 'Выходные узлы не могут иметь исходящих связей',
    };
  }

  // Input nodes cannot receive incoming connections
  if (targetType === 'input') {
    return {
      isValid: false,
      reason: 'Input nodes cannot receive incoming connections',
      reasonRu: 'Входные узлы не могут получать входящие связи',
    };
  }

  // Check source rules
  const allowedTargets = CONNECTION_RULES[sourceType];
  
  if (allowedTargets === 'any') {
    // Source can connect to anything, but check target restrictions
    return checkTargetRestrictions(sourceType, targetType);
  }

  if (Array.isArray(allowedTargets)) {
    if (allowedTargets.length === 0) {
      return {
        isValid: false,
        reason: `${sourceType} nodes cannot have outgoing connections`,
        reasonRu: `Узлы типа ${sourceType} не могут иметь исходящих связей`,
      };
    }

    if (!allowedTargets.includes(targetType)) {
      // Check if target is universal
      if (UNIVERSAL_TARGETS.includes(targetType)) {
        return checkTargetRestrictions(sourceType, targetType);
      }

      return {
        isValid: false,
        reason: `${sourceType} cannot connect to ${targetType}`,
        reasonRu: `${sourceType} не может соединяться с ${targetType}`,
      };
    }
  }

  return checkTargetRestrictions(sourceType, targetType);
}

/**
 * Check if the target node has restrictions on what can connect to it
 */
function checkTargetRestrictions(
  sourceType: FlowNodeType,
  targetType: FlowNodeType
): ConnectionValidationResult {
  const allowedSources = RESTRICTED_TARGETS[targetType];

  if (allowedSources && !allowedSources.includes(sourceType)) {
    return {
      isValid: false,
      reason: `${targetType} can only receive connections from: ${allowedSources.join(', ')}`,
      reasonRu: `${targetType} может получать связи только от: ${allowedSources.join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Get suggested data type for a connection based on source node
 */
export function getSuggestedDataType(sourceType: FlowNodeType): FlowDataType {
  return NODE_OUTPUT_TYPES[sourceType] || 'any';
}
