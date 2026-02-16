
# Plan: Duel Mode ("K Baryeru") — IMPLEMENTED (Phase 1)

Status: ✅ Core infrastructure complete (Phase 1 + Phase 2 backend)

## Completed Files

| File | Status |
|------|--------|
| `src/pages/ModelRatings.tsx` | ✅ Added 'duel' section tab |
| `src/hooks/useDuelConfig.ts` | ✅ Created |
| `src/hooks/useDuelSession.ts` | ✅ Created |
| `src/hooks/useDuelExecution.ts` | ✅ Created |
| `src/components/ratings/DuelArena.tsx` | ✅ Created |
| `src/components/ratings/DuelPlanEditor.tsx` | ✅ Created |
| `src/components/ratings/DuelBattleView.tsx` | ✅ Created |
| `src/components/ratings/DuelScoreboard.tsx` | ✅ Created |
| `src/components/ratings/duelPhases.ts` | ✅ Created |
| `src/lib/contestFlowTemplates.ts` | ✅ Added duel templates |
| `src/components/ratings/i18n.ts` | ✅ Added duel i18n keys |
| `src/content/hydrapedia/features.ts` | ✅ Added duel docs |

## Next Steps (Phase 2)

- Auto-advance rounds without user evaluation
- Duel-specific flow template generator (dedicated DAG, not reusing contest generator)
- Phase 2: Arbiter Duel (role swap — critics evaluate arbiter candidates)
- Integration with model_statistics for duel win/loss tracking

---

# Plan: Interview Mode ("Собеседование") — Phase 1 (Briefing) IMPLEMENTED

Status: ✅ Phase 1 backend complete

## Phase 1 — Briefing (DONE)

| Artifact | Status | Description |
|----------|--------|-------------|
| `interview_sessions` table | ✅ | Stores interview state, briefing data, test results, verdict |
| `supabase/functions/interview-briefing/index.ts` | ✅ | Edge function assembles Position Brief from all sources |
| RLS policies | ✅ | Full CRUD per user_id |
| `updated_at` trigger | ✅ | Auto-updates on row change |

### Briefing Assembly Logic
The edge function gathers 7 sections into a comprehensive Position Brief:
1. **Hydra Anatomy** — full organism description, all roles, hierarchy
2. **Job Description** — role-specific duties (placeholder for system prompt injection)
3. **Interaction Map** — which roles are direct collaborators
4. **Role Knowledge** — all entries from `role_knowledge` table (RAG docs)
5. **Predecessor Experience** — all `role_memory` entries grouped by type
6. **Behavior Config** — tone, verbosity, approval requirements
7. **Hierarchy** — custom Табель о рангах settings

### Key Design Decisions
- **No token limits** on briefing — invest heavily once, save on every future operation
- **System prompt injection** — brief goes as system prompt, not user message (token economy)
- **Raw experience transfer** — no distillation yet; full predecessor memory passed to candidate
- **Source tracking** — optional `source_contest_id` links interview to the contest that selected this candidate

## Phase 2 — Testing (✅ IMPLEMENTED)

### Architecture: Universal Test Container ("Box Container")
A modular container with standardized connection points:
- **Input**: role config, candidate model, test filter, briefing context
- **Output**: UI updates (progress, toasts, indicators), test results

### Container internals (role-agnostic):
1. **Test filter** — selects test set based on role from `ROLE_CONFIG.duties` + `role_knowledge`
2. **Candidate model** — the model being interviewed (from `interview_sessions.candidate_model`)
3. **Step counter** — tracks multi-step test progress
4. **SSE streaming** — real-time progress to UI via `hydra-stream` transport pattern
5. **Statistics collector** — gathers intermediate and final results per test step
6. **Trigger system** — UI indicator updates, toast notifications, component refresh

### Evaluation approach: Differential (was → will be)
- **NOT arbiter-based** — user makes the final decision
- Container collects `{ baseline: current_state, candidate_output: proposed_change }` pairs
- For each test, shows comparison: what exists now vs what the candidate proposes
- Some roles may require **testing the candidate's proposal** itself (meta-evaluation)
- Arbiter algorithms deliberately NOT connected at this phase

### Reusable code:
| What | Source | How |
|------|--------|-----|
| SSE streaming | `streamWithTimeout` + `hydra-stream` | Direct reuse |
| Execution pattern | `useContestExecution` | Adapt (linear pipeline, not parallel) |
| Progress UI | `FlowExecutionPanel` | Adapt (step indicators, progress bar) |
| Test generation | `ROLE_CONFIG.duties` + `role_knowledge` | New logic, existing data |
| Result storage | `interview_sessions.test_results` | JSONB column already exists |

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

## Phase 3 — Verdict & Inheritance (TODO)
- Arbiter evaluates test performance
- Save new experience to `role_memory` with `memory_type: 'experience'`
- Optionally assign model to the role in Staff
- One-time token warning dialog for new users
