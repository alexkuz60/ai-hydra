import { Node, Edge } from '@xyflow/react';
import type { FlowNodeData } from '@/types/flow';

/**
 * Contest Flow Template: "Free Prompt" (Linear)
 * 
 * Chain: Input → Prompt → Loop(candidates) →
 *   [Model(candidate) → Checkpoint(user rating) → Model(arbiter) → Transform(aggregate)]
 *   → loop-back / loop-exit →
 *   Transform(totals) → Checkpoint(approval) → Output
 */

interface ContestFlowConfig {
  /** Candidates model IDs from contest setup */
  candidates?: string[];
  /** Arbiter model, defaults to gemini-2.5-pro */
  arbiterModel?: string;
  /** Evaluation criteria IDs */
  criteria?: string[];
  /** Jury mode */
  juryMode?: 'user' | 'arbiter' | 'both';
  /** Task title for the Input node */
  taskTitle?: string;
  /** Task prompt text for the Prompt node */
  taskPrompt?: string;
}

const X_START = 60;
const Y_CENTER = 300;
const X_GAP = 220;
const Y_GAP = 140;

let _ts = 0;
function uid(prefix: string) {
  _ts++;
  return `${prefix}-tpl-${_ts}`;
}

export function generateContestFreePromptFlow(config: ContestFlowConfig = {}): {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
} {
  _ts = 0;
  const arbiterModel = config.arbiterModel || 'google/gemini-2.5-pro';
  const juryMode = config.juryMode || 'both';
  const criteria = config.criteria || ['factuality', 'relevance', 'completeness', 'clarity'];

  const nodes: Node<FlowNodeData>[] = [];
  const edges: Edge[] = [];

  let x = X_START;

  // ── 1. Input ──
  const inputId = uid('input');
  nodes.push({
    id: inputId,
    type: 'input',
    position: { x, y: Y_CENTER },
    data: {
      label: config.taskTitle || 'Задание конкурса',
      description: 'Текст задания и список кандидатов',
      inputType: 'user',
    },
  });
  x += X_GAP;

  // ── 2. Prompt (system prompt for candidates) ──
  const promptId = uid('prompt');
  const defaultPrompt = 'Ты — эксперт-{role}. Дай развернутый, структурированный ответ на задание пользователя.';
  nodes.push({
    id: promptId,
    type: 'prompt',
    position: { x, y: Y_CENTER },
    data: {
      label: 'Промпт задания',
      description: 'Системный промпт + задание пользователя для кандидатов',
      promptContent: config.taskPrompt || defaultPrompt,
    },
  });
  edges.push(edge(inputId, promptId));
  x += X_GAP;

  // ── 3. Loop (iterate over candidates) ──
  const loopId = uid('loop');
  nodes.push({
    id: loopId,
    type: 'loop',
    position: { x, y: Y_CENTER },
    data: {
      label: 'Цикл по кандидатам',
      loopVariable: 'candidates',
      maxIterations: 10,
      description: 'Итерация по массиву моделей-кандидатов',
    },
  });
  edges.push(edge(promptId, loopId));
  x += X_GAP;

  // ── 4. Model (candidate response) ──
  const candidateModelId = uid('model');
  nodes.push({
    id: candidateModelId,
    type: 'model',
    position: { x, y: Y_CENTER - Y_GAP },
    data: {
      label: 'Ответ кандидата',
      description: 'Текущая модель-кандидат генерирует ответ',
      modelName: '{{current_candidate}}',
      temperature: 0.7,
      maxTokens: 2048,
    },
  });
  edges.push(edge(loopId, candidateModelId));
  x += X_GAP;

  // ── 5. Checkpoint 1 (user evaluation) ──
  const checkpoint1Id = uid('condition');
  nodes.push({
    id: checkpoint1Id,
    type: 'condition',
    position: { x, y: Y_CENTER - Y_GAP },
    data: {
      label: 'Оценка пользователя',
      description: `Пользователь оценивает ответ по критериям: ${criteria.join(', ')}`,
      condition: 'user_checkpoint',
      trueLabel: 'Оценено',
      falseLabel: 'Пропустить',
    },
  });
  edges.push(edge(candidateModelId, checkpoint1Id));

  let lastBeforeMergeId = checkpoint1Id;

  // ── 6. Model (arbiter) — only if jury includes arbiter ──
  if (juryMode === 'arbiter' || juryMode === 'both') {
    x += X_GAP;
    const arbiterId = uid('model');
    nodes.push({
      id: arbiterId,
      type: 'model',
      position: { x, y: Y_CENTER - Y_GAP },
      data: {
        label: 'Оценка Арбитра',
        description: 'ИИ-арбитр анализирует ответ кандидата',
        modelName: arbiterModel,
        role: 'arbiter',
        temperature: 0.3,
        maxTokens: 1024,
      },
    });
    edges.push(edge(checkpoint1Id, arbiterId, 'true'));
    lastBeforeMergeId = arbiterId;
  }

  // ── 7. Transform (aggregate iteration result) ──
  x += X_GAP;
  const transformIterationId = uid('transform');
  nodes.push({
    id: transformIterationId,
    type: 'transform',
    position: { x, y: Y_CENTER },
    data: {
      label: 'Агрегация оценок',
      description: 'Объединение оценок пользователя и арбитра, расчёт combinedScore',
      transformType: 'json',
      transformExpression: 'aggregate_scores',
    },
  });
  edges.push(edge(lastBeforeMergeId, transformIterationId));

  // Loop-back edge (from transform back to loop)
  edges.push({
    id: uid('edge'),
    source: transformIterationId,
    target: loopId,
    sourceHandle: undefined,
    targetHandle: undefined,
    type: 'custom',
    data: { dataType: 'signal' },
    label: 'loop-back',
    style: { strokeDasharray: '6 3', stroke: 'hsl(var(--hydra-warning))' },
  });
  x += X_GAP;

  // ── 8. Transform (final totals) ──
  const transformTotalsId = uid('transform');
  nodes.push({
    id: transformTotalsId,
    type: 'transform',
    position: { x, y: Y_CENTER },
    data: {
      label: 'Итоговые результаты',
      description: 'Ранжирование кандидатов, расчёт финальных баллов',
      transformType: 'json',
      transformExpression: 'rank_candidates',
    },
  });
  // Loop exit edge
  edges.push({
    id: uid('edge'),
    source: loopId,
    target: transformTotalsId,
    sourceHandle: 'loop-exit',
    type: 'custom',
    data: { dataType: 'object' },
    label: 'exit',
  });
  x += X_GAP;

  // ── 9. Checkpoint 2 (approval) ──
  const checkpoint2Id = uid('condition');
  nodes.push({
    id: checkpoint2Id,
    type: 'condition',
    position: { x, y: Y_CENTER },
    data: {
      label: 'Утверждение результатов',
      description: 'Пользователь утверждает итоги конкурса для записи в статистику',
      condition: 'user_approval',
      trueLabel: 'Утвердить',
      falseLabel: 'Отклонить',
    },
  });
  edges.push(edge(transformTotalsId, checkpoint2Id));
  x += X_GAP;

  // ── 10. Output ──
  const outputId = uid('output');
  nodes.push({
    id: outputId,
    type: 'output',
    position: { x, y: Y_CENTER },
    data: {
      label: 'Результаты конкурса',
      description: 'Итоговые результаты сохраняются в model_statistics',
      outputType: 'chat',
    },
  });
  edges.push(edge(checkpoint2Id, outputId, 'true'));

  return { nodes, edges };
}

function edge(
  source: string,
  target: string,
  sourceHandle?: string,
): Edge {
  return {
    id: uid('edge'),
    source,
    target,
    sourceHandle,
    type: 'custom',
    data: { dataType: 'text' },
  };
}

/** Registry of all contest flow templates */
export const CONTEST_FLOW_TEMPLATES = {
  'contest-free-prompt': {
    id: 'contest-free-prompt',
    ru: 'Конкурс: Свободный промпт',
    en: 'Contest: Free Prompt',
    descriptionRu: 'Линейный цикл: задание → ответы кандидатов → оценки → арбитраж → итоги',
    descriptionEn: 'Linear loop: task → candidate responses → ratings → arbitration → results',
    generate: generateContestFreePromptFlow,
  },
} as const;

export type ContestFlowTemplateId = keyof typeof CONTEST_FLOW_TEMPLATES | 'none';
