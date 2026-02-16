
# Plan: Interview Mode ("Собеседование") — Full Pipeline

Status: ✅ Phase 1-3 complete

---

## Phase 1 — Briefing (✅ DONE)

| Artifact | Status | Description |
|----------|--------|-------------|
| `interview_sessions` table | ✅ | Stores interview state, briefing data, test results, verdict |
| `supabase/functions/interview-briefing/index.ts` | ✅ | Edge function assembles Position Brief from all sources |
| RLS policies | ✅ | Full CRUD per user_id |
| `updated_at` trigger | ✅ | Auto-updates on row change |

### Briefing Assembly Logic
Edge function gathers 7 sections into a comprehensive Position Brief:
1. **Hydra Anatomy** — full organism description, all roles, hierarchy
2. **Job Description** — role-specific duties
3. **Interaction Map** — direct collaborators
4. **Role Knowledge** — all entries from `role_knowledge` (RAG docs)
5. **Predecessor Experience** — all `role_memory` entries grouped by type
6. **Behavior Config** — tone, verbosity, approval requirements
7. **Hierarchy** — custom Табель о рангах settings

### Key Decisions
- No token limits on briefing — invest heavily once, save on every future operation
- System prompt injection — brief goes as system prompt (token economy)
- Raw experience transfer — full predecessor memory passed to candidate
- Source tracking — optional `source_contest_id` links interview to contest

---

## Phase 2 — Testing (✅ DONE)

### Architecture: Universal Test Container ("Box Container")
Modular container with standardized connection points:
- **Input**: role config, candidate model, test filter, briefing context
- **Output**: UI updates (progress, toasts, indicators), test results

### Container internals (role-agnostic):
1. **Test filter** — selects test set from `ROLE_CONFIG.duties` + `role_knowledge`
2. **Candidate model** — from `interview_sessions.candidate_model`
3. **Step counter** — tracks multi-step test progress
4. **SSE streaming** — real-time progress via `hydra-stream` transport pattern
5. **Statistics collector** — gathers results per test step
6. **Trigger system** — UI indicator updates, toast notifications

### Evaluation: Differential (was → will be)
- NOT arbiter-based — user makes the final decision
- Collects `{ baseline, candidate_output }` pairs
- Shows comparison: what exists now vs what the candidate proposes

### test_results JSONB format:
```json
{
  "steps": [
    {
      "step_index": 0,
      "task_type": "knowledge_retrieval",
      "task_prompt": "...",
      "baseline": { "current_value": "..." },
      "candidate_output": { "proposed_value": "..." },
      "status": "completed",
      "elapsed_ms": 1234,
      "token_count": 567
    }
  ],
  "total_steps": 3,
  "completed_steps": 2,
  "started_at": "...",
  "completed_at": "..."
}
```

### Reusable code:
| What | Source | How |
|------|--------|-----|
| SSE streaming | `streamWithTimeout` + `hydra-stream` | Direct reuse |
| Execution pattern | `useContestExecution` | Adapted (linear pipeline) |
| Progress UI | `FlowExecutionPanel` | Adapted (step indicators) |
| Test generation | `ROLE_CONFIG.duties` + `role_knowledge` | New logic, existing data |
| Result storage | `interview_sessions.test_results` | JSONB column |

---

## Phase 3 — Verdict & Decision (✅ DONE)

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
4. **Auto-decision** via dynamic thresholds (see below)
5. **User override** — always available via 3 buttons

### Dynamic Thresholds
| Decision | Condition |
|----------|-----------|
| **Hire** | candidate score > current holder score (same model = upskill, different = replace) |
| **Reject** | candidate score < avg of 2 previous holders |
| **Retest** | score ≤ current but ≥ previous |

### Cold Start Strategy (Phantom Predecessor)
On first hire, system creates a synthetic `role_assignment_history` entry:
- `is_synthetic = true`
- `interview_avg_score = candidate_score - 0.5`
- `removal_reason = 'replaced'`

This ensures verdict logic always has comparison data without special-casing.

### Assignment Flow
- **Hire**: close current holder (`removed_at`, `removal_reason`), insert new assignment
- **Reject**: no DB changes
- **Retest**: session goes back to 'briefed' status

---

## TODO

1. **Эконом-заглушка для кандидатов из конкурса** — если кандидат прошёл ролевой конкурс (`source_contest_id` заполнен), при тестировании использовать его ответы из конкурса вместо повторной генерации. Возможно, с переоценкой (arbiter пересчитывает баллы в контексте роли, а не конкурсного задания). Цель: экономия токенов, ускорение процесса.
