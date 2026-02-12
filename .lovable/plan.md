

# Plan: Duel Mode ("K Baryeru") for Critic and Arbiter Candidate Selection

## Overview

A new "Duel" tab in the Model Ratings page that implements a head-to-head (1v1) debate format for selecting the best Critic and Arbiter models. Unlike the existing multi-model contest, duels involve exactly 2 candidates exchanging arguments across multiple rounds, with the opponent's previous answer fed into the next round's prompt.

## Key Differences from Contest

| Aspect | Contest (existing) | Duel (new) |
|--------|-------------------|------------|
| Participants | N models, parallel | 2 models, sequential exchange |
| Prompt flow | Same prompt to all | Round N includes opponent's answer from Round N-1 |
| Memory | Own history only | Own + opponent's arguments merged into prompt |
| Evaluation | Arbiter scores each model independently | Arbiter/Critic picks a **winner per round** |
| User pause | Optional scoring widget | Optional "pick winner" pause between rounds |
| Flow template | `contest-free-prompt` | New `duel-critic` / `duel-arbiter` template |

## Architecture

### Phase 1: Critic Duel

```text
Round 1:
  [System Prompt + Duel Prompt] --> Candidate A (Critic response)
  [System Prompt + Duel Prompt] --> Candidate B (Critic response)
  Arbiter evaluates: Winner of Round 1
  (Optional) User picks winner

Round 2:
  Candidate A receives: [Original prompt + own R1 answer + B's R1 answer]
  Candidate B receives: [Original prompt + own R1 answer + A's R1 answer]
  Arbiter evaluates: Winner of Round 2
  ...repeat for N rounds...

Final: Aggregate wins across rounds --> Overall winner
```

### Phase 2 (future): Arbiter Duel
Same structure but roles swap: duellists are Arbiter candidates, Critics evaluate them.

## Implementation Steps

### 1. New Section Tab in ModelRatings page
- Add `'duel'` to the `Section` type in `src/pages/ModelRatings.tsx`
- Add a new entry in `SECTIONS` array with icon `Swords` and labels "Дуэль «К барьеру»" / "Duel «En Garde»"
- Render new `<DuelArena />` component when `activeSection === 'duel'`

### 2. Duel Configuration (Plan)
Create `src/components/ratings/DuelPlanEditor.tsx`:
- **No task selector** (per requirement 1.1 -- task selection is absent from the duel plan)
- Duel prompt textarea (the starting challenge prompt)
- Model pair selector (exactly 2 candidates from model registry)
- Round count selector (1-10)
- Duel type selector: `critic` or `arbiter`
- Criteria selection (reuse existing criteria from ArbitrationConfig)
- User evaluation toggle (enables pause after each round for user's pick)
- Store config in localStorage under `hydra-duel-*` keys, similar pattern to `useContestConfig`

### 3. Duel Configuration Hook
Create `src/hooks/useDuelConfig.ts`:
- Mirrors `useContestConfig` pattern with localStorage sync
- Fields: `modelA`, `modelB`, `roundCount`, `duelPrompt`, `duelType` (`critic` | `arbiter`), `criteria`, `userEvaluation` (boolean), `scoringScheme`
- Validation: exactly 2 models, prompt required, at least 1 round

### 4. Duel Session Hook
Create `src/hooks/useDuelSession.ts`:
- Reuses existing DB tables (`contest_sessions`, `contest_rounds`, `contest_results`) with `config.mode = 'duel'`
- `createFromDuelConfig()` -- creates session with 2 models, N rounds
- Manages the cross-pollination logic: after round N completes, builds Round N+1 prompt that includes both duelists' previous answers
- `buildDuelPrompt(round, modelId, allResults)` -- constructs the composite prompt:
  ```
  [Original duel prompt]
  ---
  Your previous argument: [own response from round N-1]
  Opponent's argument: [opponent's response from round N-1]
  ---
  Respond with your next argument.
  ```

### 5. Duel Execution Hook
Create `src/hooks/useDuelExecution.ts`:
- Similar to `useContestExecution` but with sequential round logic
- After both models respond in round N:
  1. Arbiter evaluates and picks round winner
  2. If user evaluation enabled: pause for user's pick
  3. Auto-create round N+1 with merged prompts
  4. Repeat until all rounds complete
- Final aggregation: count wins per model across all rounds

### 6. Duel Arena Component
Create `src/components/ratings/DuelArena.tsx` (thin shell):
- Two states: no active duel (show DuelPlanEditor + launch button) / active duel (show DuelBattleView)
- Launch button creates session and starts execution
- Archive dialog (reuse pattern from BeautyContest)

### 7. Duel Battle View
Create `src/components/ratings/DuelBattleView.tsx`:
- Split-screen layout: Model A (left) vs Model B (right)
- Each side shows: model name/icon, current response (streaming), round history
- Center column: round indicator, win/loss badges per round, current status
- Bottom: arbiter verdict area, user pick buttons (if enabled)

### 8. Duel Scoreboard
Create `src/components/ratings/DuelScoreboard.tsx`:
- Compact header showing: "Model A [W-D-L] Model B", current round / total rounds
- Phase-specific animated messages (similar to `contestPhases.ts` but duel-themed)
- Win streak indicators

### 9. Duel Flow Template
Add to `src/lib/contestFlowTemplates.ts`:
- New template `duel-critic`:
  ```
  Input --> Prompt --> [Model A] --> [Model B] --> 
  Arbiter Evaluation --> Checkpoint(user pick) --> 
  Transform(merge arguments) --> Loop back for next round -->
  Transform(aggregate wins) --> Output
  ```

### 10. i18n Updates
Add duel-specific keys to `src/components/ratings/i18n.ts`:
- `duelTitle`, `duelDescription`, `yourArgument`, `opponentArgument`, `roundWinner`, `pickWinner`, `duelComplete`, etc.

### 11. Duel Phase Messages
Add to `src/components/ratings/contestPhases.ts` or create `duelPhases.ts`:
- Duel-themed messages: "Дуэлянт {model} выходит к барьеру!", "Противник парирует аргумент!", etc.

### 12. Hydrapedia Documentation
Update `src/content/hydrapedia/features.ts`:
- Add duel mode documentation explaining the cross-argument mechanics and evaluation flow

## File Summary

| File | Action |
|------|--------|
| `src/pages/ModelRatings.tsx` | Edit: add 'duel' section tab |
| `src/hooks/useDuelConfig.ts` | Create: duel configuration hook |
| `src/hooks/useDuelSession.ts` | Create: duel session management |
| `src/hooks/useDuelExecution.ts` | Create: duel execution engine |
| `src/components/ratings/DuelArena.tsx` | Create: main duel container |
| `src/components/ratings/DuelPlanEditor.tsx` | Create: duel setup form |
| `src/components/ratings/DuelBattleView.tsx` | Create: split-screen battle UI |
| `src/components/ratings/DuelScoreboard.tsx` | Create: duel header/scoreboard |
| `src/components/ratings/duelPhases.ts` | Create: duel phase messages |
| `src/lib/contestFlowTemplates.ts` | Edit: add duel template |
| `src/components/ratings/i18n.ts` | Edit: add duel i18n keys |
| `src/content/hydrapedia/features.ts` | Edit: add duel docs |

## Technical Notes

- **No new DB tables needed** -- duel sessions reuse `contest_sessions` / `contest_rounds` / `contest_results` with `config.mode = 'duel'`
- The cross-pollination prompt logic is the core differentiator and lives in `useDuelSession.buildDuelPrompt()`
- The existing `contest-arbiter` edge function works as-is for evaluating duel responses -- it already supports comparing 2 responses and picking criteria scores
- File size target: each new component stays under 300 lines per the modularization standard

