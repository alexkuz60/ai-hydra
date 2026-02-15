
# Plan: Duel Mode ("K Baryeru") — IMPLEMENTED (Phase 1)

Status: ✅ Core infrastructure complete

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

## Phase 2 — Testing (TODO)
- Situational tasks per role (archivist: knowledge retrieval, promptengineer: prompt optimization, etc.)
- Automated pipeline: 3-5 tasks executed sequentially
- Results stored in `interview_sessions.test_results`

## Phase 3 — Verdict & Inheritance (TODO)
- Arbiter evaluates test performance
- Save new experience to `role_memory` with `memory_type: 'experience'`
- Optionally assign model to the role in Staff
- One-time token warning dialog for new users
