// ============================================
// ReAct Evolution Types
// ============================================

export interface TrajectoryStep {
  step: "think" | "act" | "observe" | "verify";
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface StructuredRevision {
  trajectory: TrajectoryStep[];
  revision: string;
  confidence: number;
  strategy_tags: string[];
  token_usage?: { input: number; output: number };
  verification?: VerificationResult;
}

export interface VerificationResult {
  similar_cases_found: number;
  success_rate: number | null;
  recommended_strategy: string;
  knowledge_context: string[];
  risk_assessment: "low" | "medium" | "high";
}

export interface MemoryHit {
  content: string;
  memory_type: string;
  confidence_score: number | null;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
  similarity?: number;
}

export interface KnowledgeHit {
  content: string;
  source_title: string | null;
  category: string;
  tags: string[] | null;
  similarity?: number;
}

export interface PastRevision {
  entry_code: string;
  title: string;
  ai_revision: string | null;
  supervisor_resolution: string;
  status: string;
}
