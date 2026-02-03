import { Node, Edge } from '@xyflow/react';
import type { FlowNodeData } from '@/types/flow';
import type { TaskBlueprint } from '@/types/patterns';
import { ROLE_CONFIG } from '@/config/roles';

const GROUP_WIDTH = 400;
const GROUP_HEIGHT = 200;
const NODE_WIDTH = 180;
const NODE_HEIGHT = 60;
const CHECKPOINT_WIDTH = 200;
const CHECKPOINT_HEIGHT = 80;
const HORIZONTAL_GAP = 80;
const VERTICAL_GAP = 40;
const PADDING = 40;

interface GeneratedFlow {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
}

/**
 * Generates a Flow diagram from a TaskBlueprint
 * 
 * Mapping:
 * - Stages -> Group Nodes (containers)
 * - Roles -> Model Nodes (inside groups)
 * - Checkpoints -> Condition Nodes (between stages)
 * - Deliverables -> Output Nodes (at the end)
 */
export function blueprintToFlow(blueprint: TaskBlueprint): GeneratedFlow {
  const nodes: Node<FlowNodeData>[] = [];
  const edges: Edge[] = [];
  
  let currentX = PADDING;
  let currentY = PADDING;
  let previousNodeIds: string[] = [];
  
  // Add input node
  const inputNodeId = `input-${Date.now()}`;
  nodes.push({
    id: inputNodeId,
    type: 'input',
    position: { x: currentX, y: currentY + GROUP_HEIGHT / 2 - 60 },
    data: {
      label: 'Вход',
      description: 'Входные данные пользователя',
      inputType: 'user',
    },
  });
  previousNodeIds = [inputNodeId];
  currentX += 120 + HORIZONTAL_GAP;
  
  // Get checkpoints indexed by after_stage
  const checkpointsByStage = new Map<number, typeof blueprint.checkpoints[0][]>();
  blueprint.checkpoints.forEach(cp => {
    const existing = checkpointsByStage.get(cp.after_stage) || [];
    existing.push(cp);
    checkpointsByStage.set(cp.after_stage, existing);
  });
  
  // Process each stage
  blueprint.stages.forEach((stage, stageIndex) => {
    const groupId = `group-stage-${stageIndex}-${Date.now()}`;
    const stageNodeIds: string[] = [];
    
    // Calculate group dimensions based on roles
    const rolesCount = stage.roles.length;
    const groupContentWidth = Math.max(NODE_WIDTH, rolesCount * (NODE_WIDTH + 20) - 20);
    const actualGroupWidth = groupContentWidth + PADDING * 2;
    const actualGroupHeight = GROUP_HEIGHT;
    
    // Add group node for the stage
    nodes.push({
      id: groupId,
      type: 'group',
      position: { x: currentX, y: currentY },
      data: {
        label: `${stageIndex + 1}. ${stage.name}`,
        description: stage.objective,
        color: 'hsl(var(--primary) / 0.15)',
      },
      style: {
        width: actualGroupWidth,
        height: actualGroupHeight,
      },
    });
    
    // Add model nodes for each role inside the group
    stage.roles.forEach((role, roleIndex) => {
      const roleConfig = ROLE_CONFIG[role];
      const modelNodeId = `model-${stageIndex}-${roleIndex}-${Date.now()}`;
      
      const nodeX = PADDING + roleIndex * (NODE_WIDTH + 20);
      const nodeY = (actualGroupHeight - NODE_HEIGHT) / 2;
      
      nodes.push({
        id: modelNodeId,
        type: 'model',
        position: { x: nodeX, y: nodeY },
        parentId: groupId,
        extent: 'parent',
        data: {
          label: roleConfig?.label?.replace('roles.', '') || role,
          description: `Роль: ${role}`,
          role: role,
        } as FlowNodeData,
      });
      
      stageNodeIds.push(modelNodeId);
      
      // Connect from previous nodes
      if (roleIndex === 0) {
        previousNodeIds.forEach(prevId => {
          edges.push({
            id: `edge-${prevId}-${modelNodeId}`,
            source: prevId,
            target: modelNodeId,
            type: 'custom',
            data: { dataType: 'text' },
          });
        });
      }
      
      // Connect roles within the same stage
      if (roleIndex > 0) {
        const prevRoleNodeId = stageNodeIds[roleIndex - 1];
        edges.push({
          id: `edge-${prevRoleNodeId}-${modelNodeId}`,
          source: prevRoleNodeId,
          target: modelNodeId,
          type: 'custom',
          data: { dataType: 'text' },
        });
      }
    });
    
    currentX += actualGroupWidth + HORIZONTAL_GAP;
    
    // Check if there's a checkpoint after this stage
    const stageCheckpoints = checkpointsByStage.get(stageIndex);
    if (stageCheckpoints && stageCheckpoints.length > 0) {
      stageCheckpoints.forEach((checkpoint, cpIndex) => {
        const checkpointNodeId = `checkpoint-${stageIndex}-${cpIndex}-${Date.now()}`;
        
        nodes.push({
          id: checkpointNodeId,
          type: 'condition',
          position: { 
            x: currentX, 
            y: currentY + (actualGroupHeight - CHECKPOINT_HEIGHT) / 2 
          },
          data: {
            label: `Контрольная точка`,
            description: checkpoint.condition,
            condition: checkpoint.condition,
            trueLabel: 'Да',
            falseLabel: 'Нет',
          },
        });
        
        // Connect last node of stage to checkpoint
        const lastStageNode = stageNodeIds[stageNodeIds.length - 1];
        edges.push({
          id: `edge-${lastStageNode}-${checkpointNodeId}`,
          source: lastStageNode,
          target: checkpointNodeId,
          type: 'custom',
          data: { dataType: 'signal' },
        });
        
        previousNodeIds = [checkpointNodeId];
        currentX += CHECKPOINT_WIDTH + HORIZONTAL_GAP;
      });
    } else {
      // No checkpoint, continue with last role node
      previousNodeIds = stageNodeIds.length > 0 ? [stageNodeIds[stageNodeIds.length - 1]] : previousNodeIds;
    }
  });
  
  // Add output node with deliverables from the last stage
  const lastStage = blueprint.stages[blueprint.stages.length - 1];
  const outputNodeId = `output-${Date.now()}`;
  
  nodes.push({
    id: outputNodeId,
    type: 'output',
    position: { x: currentX, y: currentY + GROUP_HEIGHT / 2 - 60 },
    data: {
      label: 'Результат',
      description: lastStage?.deliverables?.join(', ') || 'Выходные данные',
      outputType: 'chat',
    },
  });
  
  // Connect to output
  previousNodeIds.forEach(prevId => {
    edges.push({
      id: `edge-${prevId}-${outputNodeId}`,
      source: prevId,
      target: outputNodeId,
      type: 'custom',
      data: { dataType: 'text' },
    });
  });
  
  return { nodes, edges };
}
