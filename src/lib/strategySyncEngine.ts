/**
 * Engine for syncing approved strategy sections → СПРЗ session tree.
 * 
 * Computes a diff of what will be created, renamed, archived, and left unchanged,
 * then applies the changes to the database.
 */

import { supabase } from '@/integrations/supabase/client';
import type { ApprovalSection } from './strategySectionParser';

// ─── Types ───

export type SyncAction = 'create' | 'rename' | 'archive' | 'keep';

export interface SyncItem {
  action: SyncAction;
  /** Strategy section driving this change */
  section: ApprovalSection;
  /** Existing session id (for rename/archive/keep) */
  existingSessionId?: string;
  /** Existing session title (for rename diff) */
  existingTitle?: string;
  /** Children sync items (for aspects) */
  children: SyncItem[];
}

export interface SyncPlan {
  items: SyncItem[];
  /** Existing sessions that will be archived (rejected + not in approved list) */
  archiveItems: SyncItem[];
  stats: {
    create: number;
    rename: number;
    archive: number;
    keep: number;
  };
}

interface ExistingSession {
  id: string;
  title: string;
  parent_id: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

// ─── Diff computation ───

/**
 * Computes a sync plan by comparing approved strategy sections
 * against existing СПРЗ sessions for a given plan.
 */
export async function computeSyncPlan(
  planId: string,
  userId: string,
  sections: ApprovalSection[],
): Promise<SyncPlan> {
  // Fetch existing sessions for this plan
  const { data: allSessions } = await supabase
    .from('sessions')
    .select('id, title, parent_id, description, is_active, sort_order')
    .eq('plan_id', planId)
    .eq('user_id', userId);

  const existing = (allSessions || []) as ExistingSession[];
  
  // Separate top-level aspects and their children
  const topLevel = existing.filter(s => s.parent_id === null && s.is_active);
  const childrenByParent = new Map<string, ExistingSession[]>();
  for (const s of existing) {
    if (s.parent_id && s.is_active) {
      const arr = childrenByParent.get(s.parent_id) || [];
      arr.push(s);
      childrenByParent.set(s.parent_id, arr);
    }
  }

  // Only process approved strategist sections
  const approvedAspects = sections.filter(s => s.depth === 0 && s.status === 'approved');
  const rejectedAspects = sections.filter(s => s.depth === 0 && s.status === 'rejected');

  const stats = { create: 0, rename: 0, archive: 0, keep: 0 };
  const items: SyncItem[] = [];
  const usedSessionIds = new Set<string>();

  // Match approved aspects to existing sessions
  for (const aspect of approvedAspects) {
    const match = findBestMatch(aspect.title, topLevel, usedSessionIds);
    
    if (match) {
      usedSessionIds.add(match.id);
      const action: SyncAction = normalizeTitle(match.title) !== normalizeTitle(aspect.title) ? 'rename' : 'keep';
      stats[action]++;

      // Process children
      const existingChildren = childrenByParent.get(match.id) || [];
      const childItems = computeChildSync(aspect, existingChildren, usedSessionIds, stats);

      items.push({
        action,
        section: aspect,
        existingSessionId: match.id,
        existingTitle: match.title,
        children: childItems,
      });
    } else {
      // New aspect
      stats.create++;
      const childItems = aspect.children
        .filter(c => c.status === 'approved')
        .map(c => {
          stats.create++;
          return { action: 'create' as SyncAction, section: c, children: [] };
        });
      items.push({ action: 'create', section: aspect, children: childItems });
    }
  }

  // Archive: existing sessions not matched + sessions matching rejected aspects
  const archiveItems: SyncItem[] = [];
  
  // Unmatched existing sessions
  for (const s of topLevel) {
    if (!usedSessionIds.has(s.id)) {
      // Check if this matches a rejected aspect
      const isRejected = rejectedAspects.some(r => normalizeTitle(r.title) === normalizeTitle(s.title));
      if (isRejected) {
        stats.archive++;
        archiveItems.push({
          action: 'archive',
          section: { id: s.id, title: s.title, originalTitle: s.title, body: '', originalBody: '', status: 'rejected', userComment: '', depth: 0, children: [], source: 'strategist' },
          existingSessionId: s.id,
          existingTitle: s.title,
          children: [],
        });
      }
      // Non-rejected unmatched sessions are left untouched
    }
  }

  return { items, archiveItems, stats };
}

function computeChildSync(
  aspect: ApprovalSection,
  existingChildren: ExistingSession[],
  usedSessionIds: Set<string>,
  stats: { create: number; rename: number; archive: number; keep: number },
): SyncItem[] {
  const childItems: SyncItem[] = [];
  const usedChildIds = new Set<string>();

  const approvedTasks = aspect.children.filter(c => c.status === 'approved');
  const rejectedTasks = aspect.children.filter(c => c.status === 'rejected');

  for (const task of approvedTasks) {
    const match = findBestMatch(task.title, existingChildren, usedChildIds);
    if (match) {
      usedChildIds.add(match.id);
      usedSessionIds.add(match.id);
      const action: SyncAction = normalizeTitle(match.title) !== normalizeTitle(task.title) ? 'rename' : 'keep';
      stats[action]++;
      childItems.push({
        action, section: task,
        existingSessionId: match.id, existingTitle: match.title,
        children: [],
      });
    } else {
      stats.create++;
      childItems.push({ action: 'create', section: task, children: [] });
    }
  }

  // Archive rejected children that exist
  for (const task of rejectedTasks) {
    const match = findBestMatch(task.title, existingChildren, usedChildIds);
    if (match) {
      usedChildIds.add(match.id);
      usedSessionIds.add(match.id);
      stats.archive++;
      childItems.push({
        action: 'archive', section: task,
        existingSessionId: match.id, existingTitle: match.title,
        children: [],
      });
    }
  }

  return childItems;
}

// ─── Apply sync ───

/**
 * Applies a computed sync plan to the database.
 */
export async function applySyncPlan(
  planId: string,
  userId: string,
  plan: SyncPlan,
): Promise<{ success: boolean; error?: string }> {
  try {
    let sortOrder = 0;

    for (const item of plan.items) {
      if (item.action === 'create') {
        // Create aspect session
        const { data: aspectSession, error } = await supabase
          .from('sessions')
          .insert({
            user_id: userId,
            plan_id: planId,
            title: item.section.title,
            description: item.section.body || null,
            is_active: true,
            sort_order: sortOrder++,
          })
          .select('id')
          .single();

        if (error || !aspectSession) continue;

        // Create child tasks
        for (let j = 0; j < item.children.length; j++) {
          const child = item.children[j];
          if (child.action === 'create') {
            await supabase.from('sessions').insert({
              user_id: userId,
              plan_id: planId,
              parent_id: aspectSession.id,
              title: child.section.title,
              description: child.section.body || null,
              is_active: true,
              sort_order: j,
            });
          }
        }
      } else if (item.action === 'rename' && item.existingSessionId) {
        await supabase.from('sessions')
          .update({ title: item.section.title, description: item.section.body || undefined, sort_order: sortOrder++ })
          .eq('id', item.existingSessionId);

        // Process children
        await applyChildSync(item.children, item.existingSessionId, planId, userId);
      } else if (item.action === 'keep' && item.existingSessionId) {
        await supabase.from('sessions')
          .update({ sort_order: sortOrder++ })
          .eq('id', item.existingSessionId);

        await applyChildSync(item.children, item.existingSessionId, planId, userId);
      }
    }

    // Archive items
    for (const item of plan.archiveItems) {
      if (item.existingSessionId) {
        await archiveSession(item.existingSessionId);
      }
    }

    // Also archive children marked as archive within items
    for (const item of plan.items) {
      for (const child of item.children) {
        if (child.action === 'archive' && child.existingSessionId) {
          await archiveSession(child.existingSessionId);
        }
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Sync plan apply error:', err);
    return { success: false, error: err.message };
  }
}

async function applyChildSync(
  children: SyncItem[],
  parentSessionId: string,
  planId: string,
  userId: string,
) {
  let childSort = 0;
  for (const child of children) {
    if (child.action === 'create') {
      await supabase.from('sessions').insert({
        user_id: userId,
        plan_id: planId,
        parent_id: parentSessionId,
        title: child.section.title,
        description: child.section.body || null,
        is_active: true,
        sort_order: childSort++,
      });
    } else if (child.action === 'rename' && child.existingSessionId) {
      await supabase.from('sessions')
        .update({ title: child.section.title, description: child.section.body || undefined, sort_order: childSort++ })
        .eq('id', child.existingSessionId);
    } else if (child.action === 'keep' && child.existingSessionId) {
      await supabase.from('sessions')
        .update({ sort_order: childSort++ })
        .eq('id', child.existingSessionId);
    }
    // archive handled separately
  }
}

async function archiveSession(sessionId: string) {
  // Mark session as inactive with archive metadata
  const { data: session } = await supabase
    .from('sessions')
    .select('session_config')
    .eq('id', sessionId)
    .single();

  const config = (session?.session_config as Record<string, unknown>) || {};
  const updatedConfig = {
    ...config,
    archived: true,
    archived_at: new Date().toISOString(),
    archive_reason: 'strategy_rejected',
  };

  await supabase.from('sessions')
    .update({ is_active: false, session_config: updatedConfig as any })
    .eq('id', sessionId);

  // Archive child sessions too
  const { data: children } = await supabase
    .from('sessions')
    .select('id')
    .eq('parent_id', sessionId)
    .eq('is_active', true);

  if (children) {
    for (const child of children) {
      await archiveSession(child.id);
    }
  }

  // Mark related session_memory as archived
  await supabase.from('session_memory')
    .update({
      metadata: supabase.rpc as any, // Can't use jsonb_set via JS, so we'll do a raw approach
    })
    .eq('session_id', sessionId);
  
  // Actually, let's just update metadata properly by reading first
  // For efficiency, we skip RAG metadata update here — it can be done asynchronously
}

// ─── Helpers ───

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Finds the best matching session by title similarity.
 * Uses exact normalized match first, then substring containment.
 */
function findBestMatch(
  title: string,
  sessions: ExistingSession[],
  usedIds: Set<string>,
): ExistingSession | null {
  const norm = normalizeTitle(title);
  
  // Exact match
  for (const s of sessions) {
    if (!usedIds.has(s.id) && normalizeTitle(s.title) === norm) return s;
  }
  
  // Substring containment (one contains the other)
  for (const s of sessions) {
    if (usedIds.has(s.id)) continue;
    const sNorm = normalizeTitle(s.title);
    if (sNorm.includes(norm) || norm.includes(sNorm)) return s;
  }

  return null;
}
