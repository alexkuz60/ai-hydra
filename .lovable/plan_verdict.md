
# Plan: Interview Mode — Phase 3 (Verdict) IMPLEMENTED

Status: ✅ Phase 3 complete

## Phase 3 — Verdict & Decision

| Artifact | Status | Description |
|----------|--------|-------------|
| `role_assignment_history` table | ✅ | Tracks model assignments per role with scores, synthetic flag |
| `supabase/functions/interview-verdict/index.ts` | ✅ | Arbiter → Moderator → Archivist pipeline with SSE |
| `src/hooks/useInterviewVerdict.ts` | ✅ | Frontend hook for verdict SSE + apply decision |
| `src/components/staff/InterviewPanel.tsx` | ✅ | VerdictSection with scores, flags, decision buttons |

### Verdict Pipeline
1. **Arbiter** (Lovable AI) → structured tool-call evaluation per role criteria → scores, red_flags, recommendation, confidence
2. **Moderator** (hydra-stream) → 2-3 sentence HR summary
3. **Archivist** → saves experience to `role_memory`
4. **Auto-decision** via dynamic thresholds:
   - **Hire**: candidate score > current holder score (same model = upskill, different = replace)
   - **Reject**: candidate score < avg of 2 previous holders
   - **Retest**: score ≤ current but ≥ previous
   - **Cold start**: auto=hire + phantom predecessor record (score - 0.5)
5. **User override**: always available via 3 buttons

### Cold Start Strategy
On first hire, system creates a synthetic `role_assignment_history` entry with `is_synthetic=true` and score slightly below the candidate's actual score. This ensures verdict logic always has comparison data.

### Assignment History
On hire: close current holder (`removed_at`, `removal_reason`), insert new assignment. On reject: no DB changes. On retest: session goes back to 'briefed' status.
