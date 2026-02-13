import { Node, Edge } from '@xyflow/react';
import type { FlowNodeData } from '@/types/flow';

interface DuelFlowConfig {
  modelA?: string;
  modelB?: string;
  arbiterModel?: string;
  criteria?: string[];
  roundCount?: number;
  duelPrompt?: string;
}

const X_GAP = 220;
const Y_CENTER = 300;
const Y_GAP = 140;

let _ts = 0;
function uid(prefix: string) {
  _ts++;
  return `${prefix}-duel-${_ts}`;
}

function edge(source: string, target: string, sourceHandle?: string): Edge {
  return {
    id: uid('edge'),
    source,
    target,
    sourceHandle,
    type: 'custom',
    data: { dataType: 'text' },
  };
}

/**
 * Duel: Critic Selection Flow
 * Input → Prompt → Loop(rounds) → [Model A → Model B → Merge → Arbiter → Aggregate] → loop-back → Totals → Output
 */
export function generateDuelCriticFlow(config: DuelFlowConfig = {}): {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
} {
  _ts = 0;
  const arbiter = config.arbiterModel || 'google/gemini-2.5-pro';
  const criteria = config.criteria || ['factuality', 'relevance', 'clarity', 'argument_strength'];
  const nodes: Node<FlowNodeData>[] = [];
  const edges: Edge[] = [];
  let x = 60;

  // 1. Input
  const inputId = uid('input');
  nodes.push({
    id: inputId, type: 'input', position: { x, y: Y_CENTER },
    data: { label: 'Тема дуэли', description: 'Стартовый промпт для обоих дуэлянтов', inputType: 'user' },
  });
  x += X_GAP;

  // 2. Prompt
  const promptId = uid('prompt');
  nodes.push({
    id: promptId, type: 'prompt', position: { x, y: Y_CENTER },
    data: {
      label: 'Системный промпт',
      description: 'Инструкция для дуэлянтов-критиков',
      promptContent: config.duelPrompt || 'Вы — эксперт-критик в дуэли. Дайте аргументированную оценку.',
    },
  });
  edges.push(edge(inputId, promptId));
  x += X_GAP;

  // 3. Loop
  const loopId = uid('loop');
  nodes.push({
    id: loopId, type: 'loop', position: { x, y: Y_CENTER },
    data: {
      label: 'Цикл раундов',
      loopVariable: 'rounds',
      maxIterations: config.roundCount || 3,
      description: `${config.roundCount || 3} раундов дуэли`,
    },
  });
  edges.push(edge(promptId, loopId));
  x += X_GAP;

  // 4. Model A
  const modelAId = uid('model');
  nodes.push({
    id: modelAId, type: 'model', position: { x, y: Y_CENTER - Y_GAP },
    data: {
      label: 'Дуэлянт A',
      description: 'Первая модель формулирует аргумент',
      modelName: config.modelA || '{{model_a}}',
      temperature: 0.7, maxTokens: 4096,
    },
  });
  edges.push(edge(loopId, modelAId));

  // 5. Model B
  const modelBId = uid('model');
  nodes.push({
    id: modelBId, type: 'model', position: { x, y: Y_CENTER + Y_GAP },
    data: {
      label: 'Дуэлянт B',
      description: 'Вторая модель формулирует контраргумент',
      modelName: config.modelB || '{{model_b}}',
      temperature: 0.7, maxTokens: 4096,
    },
  });
  edges.push(edge(loopId, modelBId));
  x += X_GAP;

  // 6. Merge
  const mergeId = uid('merge');
  nodes.push({
    id: mergeId, type: 'merge', position: { x, y: Y_CENTER },
    data: {
      label: 'Слияние аргументов',
      description: 'Объединение ответов A и B для передачи арбитру',
    },
  });
  edges.push(edge(modelAId, mergeId));
  edges.push(edge(modelBId, mergeId));
  x += X_GAP;

  // 7. Arbiter
  const arbiterId = uid('model');
  nodes.push({
    id: arbiterId, type: 'model', position: { x, y: Y_CENTER },
    data: {
      label: 'Арбитр',
      description: `Оценка по критериям: ${criteria.join(', ')}`,
      modelName: arbiter,
      role: 'arbiter',
      temperature: 0.3, maxTokens: 1024,
    },
  });
  edges.push(edge(mergeId, arbiterId));
  x += X_GAP;

  // 8. Aggregate
  const aggId = uid('transform');
  nodes.push({
    id: aggId, type: 'transform', position: { x, y: Y_CENTER },
    data: {
      label: 'Агрегация раунда',
      description: 'Расчёт баллов и определение победителя раунда',
      transformType: 'json', transformExpression: 'aggregate_duel_scores',
    },
  });
  edges.push(edge(arbiterId, aggId));

  // Loop-back
  edges.push({
    id: uid('edge'), source: aggId, target: loopId,
    type: 'custom', data: { dataType: 'signal' },
    label: 'loop-back',
    style: { strokeDasharray: '6 3', stroke: 'hsl(var(--hydra-warning))' },
  });
  x += X_GAP;

  // 9. Totals
  const totalsId = uid('transform');
  nodes.push({
    id: totalsId, type: 'transform', position: { x, y: Y_CENTER },
    data: {
      label: 'Итоги дуэли',
      description: 'Финальный счёт и определение общего победителя',
      transformType: 'json', transformExpression: 'rank_duelists',
    },
  });
  edges.push({
    id: uid('edge'), source: loopId, target: totalsId,
    sourceHandle: 'loop-exit', type: 'custom', data: { dataType: 'object' }, label: 'exit',
  });
  x += X_GAP;

  // 10. Output
  const outputId = uid('output');
  nodes.push({
    id: outputId, type: 'output', position: { x, y: Y_CENTER },
    data: { label: 'Результат дуэли', description: 'Сохранение в model_statistics', outputType: 'chat' },
  });
  edges.push(edge(totalsId, outputId));

  return { nodes, edges };
}

/**
 * Duel: Arbiter Selection Flow
 * Same structure but duelists act as arbiters evaluating a fixed prompt,
 * and critics evaluate the quality of their arbitration.
 */
export function generateDuelArbiterFlow(config: DuelFlowConfig = {}): {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
} {
  _ts = 0;
  const critic = config.arbiterModel || 'google/gemini-2.5-pro';
  const criteria = config.criteria || ['fairness', 'decision_justification', 'nuance_preservation', 'synthesis_quality'];
  const nodes: Node<FlowNodeData>[] = [];
  const edges: Edge[] = [];
  let x = 60;

  // 1. Input
  const inputId = uid('input');
  nodes.push({
    id: inputId, type: 'input', position: { x, y: Y_CENTER },
    data: { label: 'Кейс для арбитража', description: 'Материал, который арбитры должны оценить', inputType: 'user' },
  });
  x += X_GAP;

  // 2. Prompt
  const promptId = uid('prompt');
  nodes.push({
    id: promptId, type: 'prompt', position: { x, y: Y_CENTER },
    data: {
      label: 'Инструкция арбитрам',
      description: 'Системный промпт для кандидатов-арбитров',
      promptContent: config.duelPrompt || 'Вы — арбитр. Дайте справедливую оценку представленного кейса.',
    },
  });
  edges.push(edge(inputId, promptId));
  x += X_GAP;

  // 3. Loop
  const loopId = uid('loop');
  nodes.push({
    id: loopId, type: 'loop', position: { x, y: Y_CENTER },
    data: { label: 'Цикл раундов', loopVariable: 'rounds', maxIterations: config.roundCount || 3, description: `${config.roundCount || 3} раундов` },
  });
  edges.push(edge(promptId, loopId));
  x += X_GAP;

  // 4. Arbiter A
  const arbAId = uid('model');
  nodes.push({
    id: arbAId, type: 'model', position: { x, y: Y_CENTER - Y_GAP },
    data: { label: 'Арбитр A', modelName: config.modelA || '{{model_a}}', role: 'arbiter', temperature: 0.3, maxTokens: 2048 },
  });
  edges.push(edge(loopId, arbAId));

  // 5. Arbiter B
  const arbBId = uid('model');
  nodes.push({
    id: arbBId, type: 'model', position: { x, y: Y_CENTER + Y_GAP },
    data: { label: 'Арбитр B', modelName: config.modelB || '{{model_b}}', role: 'arbiter', temperature: 0.3, maxTokens: 2048 },
  });
  edges.push(edge(loopId, arbBId));
  x += X_GAP;

  // 6. Merge
  const mergeId = uid('merge');
  nodes.push({
    id: mergeId, type: 'merge', position: { x, y: Y_CENTER },
    data: { label: 'Слияние оценок', description: 'Объединение вердиктов обоих арбитров' },
  });
  edges.push(edge(arbAId, mergeId));
  edges.push(edge(arbBId, mergeId));
  x += X_GAP;

  // 7. Critic (meta-evaluator)
  const criticId = uid('model');
  nodes.push({
    id: criticId, type: 'model', position: { x, y: Y_CENTER },
    data: {
      label: 'Мета-критик',
      description: `Оценка качества арбитража: ${criteria.join(', ')}`,
      modelName: critic, role: 'critic', temperature: 0.3, maxTokens: 1024,
    },
  });
  edges.push(edge(mergeId, criticId));
  x += X_GAP;

  // 8. Aggregate
  const aggId = uid('transform');
  nodes.push({
    id: aggId, type: 'transform', position: { x, y: Y_CENTER },
    data: { label: 'Агрегация', transformType: 'json', transformExpression: 'aggregate_arbiter_scores' },
  });
  edges.push(edge(criticId, aggId));
  edges.push({
    id: uid('edge'), source: aggId, target: loopId,
    type: 'custom', data: { dataType: 'signal' }, label: 'loop-back',
    style: { strokeDasharray: '6 3', stroke: 'hsl(var(--hydra-warning))' },
  });
  x += X_GAP;

  // 9. Totals
  const totalsId = uid('transform');
  nodes.push({
    id: totalsId, type: 'transform', position: { x, y: Y_CENTER },
    data: { label: 'Итоги', transformType: 'json', transformExpression: 'rank_arbiters' },
  });
  edges.push({
    id: uid('edge'), source: loopId, target: totalsId,
    sourceHandle: 'loop-exit', type: 'custom', data: { dataType: 'object' }, label: 'exit',
  });
  x += X_GAP;

  // 10. Output
  const outputId = uid('output');
  nodes.push({
    id: outputId, type: 'output', position: { x, y: Y_CENTER },
    data: { label: 'Результат отбора', outputType: 'chat' },
  });
  edges.push(edge(totalsId, outputId));

  return { nodes, edges };
}
