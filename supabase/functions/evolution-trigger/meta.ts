import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { MemoryHit } from "./types.ts";

// ============================================
// Phase 3: Meta-Learning & Self-Correction
// ============================================

export interface StrategyWeight {
  tag: string;
  success_count: number;
  failure_count: number;
  total: number;
  success_rate: number;
  confidence_adjustment: number; // positive = boost, negative = penalty
}

export interface MetaLearning {
  strategy_weights: StrategyWeight[];
  recommended_tags: string[];
  avoided_tags: string[];
  meta_confidence_modifier: number; // overall modifier to apply
}

/**
 * Analyze past revision outcomes from role_memory to build strategy weights.
 * Looks at memories of type "success" and "mistake" with strategy_tags in metadata.
 */
export async function buildMetaLearning(
  supabase: ReturnType<typeof createClient>,
  role: string,
  roleObject: string,
  limit = 30,
): Promise<MetaLearning> {
  // Fetch outcome memories (success + mistake) for this role
  const { data: outcomes } = await supabase
    .from("role_memory")
    .select("content, memory_type, metadata, confidence_score, tags")
    .eq("role", role)
    .in("memory_type", ["success", "mistake"])
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (!outcomes || outcomes.length === 0) {
    return {
      strategy_weights: [],
      recommended_tags: [],
      avoided_tags: [],
      meta_confidence_modifier: 0,
    };
  }

  // Aggregate strategy tag statistics
  const tagStats: Record<string, { success: number; failure: number }> = {};

  for (const outcome of outcomes) {
    const meta = (outcome.metadata || {}) as Record<string, unknown>;
    const strategyTags = (meta.strategy_tags as string[]) || (outcome.tags as string[]) || [];
    const isSuccess = outcome.memory_type === "success";
    const matchesObject = !roleObject || (meta.role_object as string) === roleObject;

    // Weight matches to same role_object higher
    const weight = matchesObject ? 1 : 0.5;

    for (const tag of strategyTags) {
      if (!tagStats[tag]) tagStats[tag] = { success: 0, failure: 0 };
      if (isSuccess) tagStats[tag].success += weight;
      else tagStats[tag].failure += weight;
    }
  }

  // Build strategy weights
  const strategyWeights: StrategyWeight[] = Object.entries(tagStats).map(([tag, stats]) => {
    const total = stats.success + stats.failure;
    const successRate = total > 0 ? stats.success / total : 0;

    // Confidence adjustment: +0.05 for high success, -0.1 for high failure
    let adjustment = 0;
    if (total >= 2) {
      if (successRate >= 0.7) adjustment = 0.05;
      else if (successRate <= 0.3) adjustment = -0.1;
      else if (successRate <= 0.5) adjustment = -0.05;
    }

    return {
      tag,
      success_count: stats.success,
      failure_count: stats.failure,
      total,
      success_rate: successRate,
      confidence_adjustment: adjustment,
    };
  });

  // Sort by total usage descending
  strategyWeights.sort((a, b) => b.total - a.total);

  const recommended = strategyWeights
    .filter(w => w.success_rate >= 0.6 && w.total >= 2)
    .map(w => w.tag);

  const avoided = strategyWeights
    .filter(w => w.success_rate <= 0.3 && w.total >= 2)
    .map(w => w.tag);

  // Overall confidence modifier: average of individual adjustments, capped
  const modifiers = strategyWeights.filter(w => w.total >= 2).map(w => w.confidence_adjustment);
  const metaModifier = modifiers.length > 0
    ? Math.max(-0.15, Math.min(0.1, modifiers.reduce((a, b) => a + b, 0) / modifiers.length))
    : 0;

  return {
    strategy_weights: strategyWeights,
    recommended_tags: recommended,
    avoided_tags: avoided,
    meta_confidence_modifier: metaModifier,
  };
}

/**
 * Save the outcome of a supervisor resolution as a memory entry.
 * Called when a revised chronicle gets accepted or rejected again.
 */
export async function saveRevisionOutcome(
  supabase: ReturnType<typeof createClient>,
  params: {
    role: string;
    userId: string;
    entryCode: string;
    title: string;
    roleObject: string;
    strategyTags: string[];
    confidence: number;
    resolution: "accepted" | "rejected";
    supervisorComment?: string;
  },
): Promise<void> {
  const memoryType = params.resolution === "accepted" ? "success" : "mistake";

  const content = params.resolution === "accepted"
    ? `Ревизия ${params.entryCode} «${params.title}» принята. Стратегии: ${params.strategyTags.join(", ")}. Уверенность: ${Math.round(params.confidence * 100)}%.`
    : `Ревизия ${params.entryCode} «${params.title}» отклонена повторно. Стратегии: ${params.strategyTags.join(", ")}. Причина: ${params.supervisorComment || "не указана"}.`;

  const { error } = await supabase
    .from("role_memory")
    .insert({
      user_id: params.userId,
      role: params.role,
      content,
      memory_type: memoryType,
      confidence_score: params.resolution === "accepted" ? Math.min(params.confidence + 0.1, 1.0) : Math.max(params.confidence - 0.15, 0.1),
      tags: params.strategyTags,
      metadata: {
        source: "evolution_outcome",
        entry_code: params.entryCode,
        role_object: params.roleObject,
        strategy_tags: params.strategyTags,
        original_confidence: params.confidence,
        resolution: params.resolution,
        supervisor_comment: params.supervisorComment || null,
      },
    });

  if (error) {
    console.error("[meta] Failed to save revision outcome:", error.message);
  }
}

/**
 * Format meta-learning data for injection into the ReAct THINK prompt.
 */
export function formatMetaContext(meta: MetaLearning): string {
  if (meta.strategy_weights.length === 0) return "";

  const lines: string[] = ["\n📊 Мета-обучение (Фаза 3):"];

  if (meta.recommended_tags.length > 0) {
    lines.push(`  ✅ Рекомендуемые стратегии: ${meta.recommended_tags.join(", ")}`);
  }
  if (meta.avoided_tags.length > 0) {
    lines.push(`  ⚠️ Избегать стратегий: ${meta.avoided_tags.join(", ")}`);
  }

  const topWeights = meta.strategy_weights.slice(0, 5);
  if (topWeights.length > 0) {
    lines.push("  Статистика:");
    for (const w of topWeights) {
      lines.push(`    - ${w.tag}: ${Math.round(w.success_rate * 100)}% успех (${w.total} случаев)`);
    }
  }

  return lines.join("\n");
}
