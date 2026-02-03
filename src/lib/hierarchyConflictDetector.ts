import type { AgentRole } from '@/config/roles';
import type { RoleInteractions } from '@/types/patterns';

/**
 * Represents a conflict between role hierarchy settings
 */
export interface HierarchyConflict {
  sourceRole: AgentRole;
  targetRole: AgentRole;
  sourceRelation: 'defers_to' | 'challenges' | 'collaborates';
  targetRelation: 'defers_to' | 'challenges' | 'collaborates' | 'none';
  expectedTargetRelation: 'defers_to' | 'challenges' | 'collaborates';
}

/**
 * Represents a sync operation to fix a conflict
 */
export interface SyncOperation {
  role: AgentRole;
  action: 'add' | 'remove';
  list: 'defers_to' | 'challenges' | 'collaborates';
  targetRole: AgentRole;
}

/**
 * Get the current relation type for a role towards another role
 */
function getRelationType(
  interactions: RoleInteractions | undefined,
  targetRole: AgentRole
): 'defers_to' | 'challenges' | 'collaborates' | 'none' {
  if (!interactions) return 'none';
  
  if (interactions.defers_to?.includes(targetRole)) return 'defers_to';
  if (interactions.challenges?.includes(targetRole)) return 'challenges';
  if (interactions.collaborates?.includes(targetRole)) return 'collaborates';
  return 'none';
}

/**
 * Detect conflicts between the current role's new interactions and all other role behaviors
 * 
 * Symmetry rules:
 * - A.defers_to[B] ↔ B.challenges[A] (Superior/Subordinate)
 * - A.collaborates[B] ↔ B.collaborates[A] (Peers)
 */
export function detectConflicts(
  currentRole: AgentRole,
  newInteractions: RoleInteractions,
  allBehaviors: Map<AgentRole, RoleInteractions>
): HierarchyConflict[] {
  const conflicts: HierarchyConflict[] = [];

  // Check defers_to (superiors) - they should have us in challenges
  for (const superior of newInteractions.defers_to || []) {
    const superiorInteractions = allBehaviors.get(superior);
    if (!superiorInteractions?.challenges?.includes(currentRole)) {
      conflicts.push({
        sourceRole: currentRole,
        targetRole: superior,
        sourceRelation: 'defers_to',
        targetRelation: getRelationType(superiorInteractions, currentRole),
        expectedTargetRelation: 'challenges',
      });
    }
  }

  // Check challenges (subordinates) - they should have us in defers_to
  for (const subordinate of newInteractions.challenges || []) {
    const subordinateInteractions = allBehaviors.get(subordinate);
    if (!subordinateInteractions?.defers_to?.includes(currentRole)) {
      conflicts.push({
        sourceRole: currentRole,
        targetRole: subordinate,
        sourceRelation: 'challenges',
        targetRelation: getRelationType(subordinateInteractions, currentRole),
        expectedTargetRelation: 'defers_to',
      });
    }
  }

  // Check collaborates (peers) - they should have us in collaborates too
  for (const peer of newInteractions.collaborates || []) {
    const peerInteractions = allBehaviors.get(peer);
    if (!peerInteractions?.collaborates?.includes(currentRole)) {
      conflicts.push({
        sourceRole: currentRole,
        targetRole: peer,
        sourceRelation: 'collaborates',
        targetRelation: getRelationType(peerInteractions, currentRole),
        expectedTargetRelation: 'collaborates',
      });
    }
  }

  return conflicts;
}

/**
 * Generate sync operations to resolve all conflicts
 * Strategy: Update the target role to match the expected symmetric relationship
 */
export function generateSyncOperations(
  conflicts: HierarchyConflict[]
): SyncOperation[] {
  const operations: SyncOperation[] = [];

  for (const conflict of conflicts) {
    // First, remove from conflicting list if there is one
    if (conflict.targetRelation !== 'none') {
      operations.push({
        role: conflict.targetRole,
        action: 'remove',
        list: conflict.targetRelation,
        targetRole: conflict.sourceRole,
      });
    }

    // Then add to the expected list
    operations.push({
      role: conflict.targetRole,
      action: 'add',
      list: conflict.expectedTargetRelation,
      targetRole: conflict.sourceRole,
    });
  }

  return operations;
}

/**
 * Apply a single sync operation to interactions
 */
export function applyOperationToInteractions(
  interactions: RoleInteractions,
  operation: SyncOperation
): RoleInteractions {
  const newInteractions = {
    defers_to: [...(interactions.defers_to || [])],
    challenges: [...(interactions.challenges || [])],
    collaborates: [...(interactions.collaborates || [])],
  };

  if (operation.action === 'remove') {
    newInteractions[operation.list] = newInteractions[operation.list].filter(
      (r) => r !== operation.targetRole
    );
  } else if (operation.action === 'add') {
    if (!newInteractions[operation.list].includes(operation.targetRole)) {
      newInteractions[operation.list].push(operation.targetRole);
    }
  }

  return newInteractions;
}

/**
 * Group sync operations by role for batch database updates
 */
export function groupOperationsByRole(
  operations: SyncOperation[]
): Map<AgentRole, SyncOperation[]> {
  const grouped = new Map<AgentRole, SyncOperation[]>();

  for (const op of operations) {
    const existing = grouped.get(op.role) || [];
    existing.push(op);
    grouped.set(op.role, existing);
  }

  return grouped;
}
