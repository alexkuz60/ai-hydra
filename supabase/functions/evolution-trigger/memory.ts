import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { MemoryHit, KnowledgeHit, PastRevision, VerificationResult } from "./types.ts";

// ============================================
// Memory & Knowledge Search Helpers
// ============================================

/** Resolve role name for memory search based on role_object field */
export function resolveRoleForSearch(roleObject: string): string {
  const r = roleObject.toLowerCase();
  if (r.includes("technoarbiter") || r.includes("арбитр")) return "technoarbiter";
  if (r.includes("technocritic") || r.includes("критик")) return "technocritic";
  if (r.includes("guide") || r.includes("гид")) return "guide";
  if (r.includes("moderator") || r.includes("модератор")) return "moderator";
  return "assistant";
}

/** Search role_memory using text-based filtering (Phase 1 fallback) */
export async function searchRoleMemoryText(
  supabase: ReturnType<typeof createClient>,
  role: string,
  memoryTypes: string[] = ["experience", "mistake", "success"],
  limit = 5,
): Promise<MemoryHit[]> {
  const { data } = await supabase
    .from("role_memory")
    .select("content, memory_type, confidence_score, tags, metadata")
    .eq("role", role)
    .in("memory_type", memoryTypes)
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data || []) as MemoryHit[];
}

/** Search role_memory using vector similarity (Phase 2) */
export async function searchRoleMemoryVector(
  supabase: ReturnType<typeof createClient>,
  role: string,
  embedding: number[],
  memoryTypes: string[] = ["experience", "mistake", "success"],
  limit = 8,
): Promise<MemoryHit[]> {
  const { data, error } = await supabase.rpc("search_role_memory", {
    p_role: role,
    p_query_embedding: JSON.stringify(embedding),
    p_memory_types: memoryTypes,
    p_limit: limit,
  });

  if (error) {
    console.warn("[evolution] Vector search role_memory failed:", error.message);
    return [];
  }
  return (data || []) as MemoryHit[];
}

/** Search role_knowledge using hybrid search (Phase 2) */
export async function searchRoleKnowledgeHybrid(
  supabase: ReturnType<typeof createClient>,
  role: string,
  queryText: string,
  embedding: number[],
  categories: string[] | null = null,
  limit = 5,
): Promise<KnowledgeHit[]> {
  const { data, error } = await supabase.rpc("hybrid_search_role_knowledge", {
    p_role: role,
    p_query_text: queryText,
    p_query_embedding: JSON.stringify(embedding),
    p_categories: categories,
    p_limit: limit,
  });

  if (error) {
    console.warn("[evolution] Hybrid search role_knowledge failed:", error.message);
    return [];
  }
  return (data || []) as KnowledgeHit[];
}

/** Search past chronicle revisions for the same role_object */
export async function searchPastRevisions(
  supabase: ReturnType<typeof createClient>,
  roleObject: string,
  excludeId: string,
  limit = 5,
): Promise<PastRevision[]> {
  const { data } = await supabase
    .from("chronicles")
    .select("entry_code, title, ai_revision, supervisor_resolution, status")
    .eq("role_object", roleObject)
    .neq("id", excludeId)
    .not("ai_revision", "is", null)
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data || []) as PastRevision[];
}

/** Analyze past revisions to compute success rate and patterns */
export function analyzePastRevisions(revisions: PastRevision[]): {
  successRate: number | null;
  successfulStrategies: string[];
  failedStrategies: string[];
} {
  if (!revisions.length) return { successRate: null, successfulStrategies: [], failedStrategies: [] };

  let accepted = 0;
  let rejected = 0;
  const successfulStrategies: string[] = [];
  const failedStrategies: string[] = [];

  for (const rev of revisions) {
    if (rev.supervisor_resolution === "accepted") {
      accepted++;
      // Extract strategy tags from accepted revisions
      try {
        const parsed = JSON.parse(rev.ai_revision || "{}");
        if (parsed.strategy_tags) successfulStrategies.push(...parsed.strategy_tags);
      } catch { /* plain text revision, no tags */ }
    } else if (rev.supervisor_resolution === "rejected") {
      rejected++;
      try {
        const parsed = JSON.parse(rev.ai_revision || "{}");
        if (parsed.strategy_tags) failedStrategies.push(...parsed.strategy_tags);
      } catch { /* ignore */ }
    }
  }

  const total = accepted + rejected;
  return {
    successRate: total > 0 ? accepted / total : null,
    successfulStrategies: [...new Set(successfulStrategies)],
    failedStrategies: [...new Set(failedStrategies)],
  };
}

/** Build verification result from all gathered data */
export function buildVerification(
  memoryHits: MemoryHit[],
  knowledgeHits: KnowledgeHit[],
  pastRevisions: PastRevision[],
  analysis: ReturnType<typeof analyzePastRevisions>,
): VerificationResult {
  const knowledgeContext = knowledgeHits
    .filter(k => k.similarity && k.similarity > 0.5)
    .map(k => `[${k.category}] ${k.content.substring(0, 150)}`);

  let riskAssessment: "low" | "medium" | "high" = "medium";
  if (analysis.successRate !== null) {
    if (analysis.successRate >= 0.7) riskAssessment = "low";
    else if (analysis.successRate < 0.3) riskAssessment = "high";
  }
  if (memoryHits.length === 0 && knowledgeHits.length === 0) {
    riskAssessment = "high"; // no context = high risk
  }

  const recommendedStrategy = analysis.successfulStrategies.length > 0
    ? `Приоритетные стратегии (по прошлому успеху): ${analysis.successfulStrategies.join(", ")}`
    : "Нет достаточных данных для рекомендации стратегии — применить осторожный подход.";

  return {
    similar_cases_found: memoryHits.length + pastRevisions.length,
    success_rate: analysis.successRate,
    recommended_strategy: recommendedStrategy,
    knowledge_context: knowledgeContext,
    risk_assessment: riskAssessment,
  };
}
