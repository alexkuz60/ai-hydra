/**
 * Contest scoring algorithms: weighted-avg, tournament, elo.
 * All operate on existing ContestResult[] without extra LLM calls.
 */

import type { ContestResult } from '@/hooks/useContestSession';

export type ScoringScheme = 'weighted-avg' | 'tournament' | 'elo';

export interface ScoredModel {
  modelId: string;
  finalScore: number;
  rank: number;
  avgUser: number | null;
  avgArbiter: number | null;
  /** Scheme-specific details */
  details: {
    /** weighted-avg: weighted total */
    weightedTotal?: number;
    /** tournament: wins / draws / losses */
    wins?: number;
    draws?: number;
    losses?: number;
    tournamentPoints?: number;
    /** elo: final Elo rating */
    eloRating?: number;
    eloInitial?: number;
  };
  criteriaAvg: Record<string, number | null>;
}

// ─── Helpers ────────────────────────────────────────────

function groupByModel(results: ContestResult[]) {
  const map = new Map<string, ContestResult[]>();
  for (const r of results) {
    const arr = map.get(r.model_id) || [];
    arr.push(r);
    map.set(r.model_id, arr);
  }
  return map;
}

function avgOrNull(vals: number[]): number | null {
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

function modelAvgScores(mrs: ContestResult[]) {
  const uScores = mrs.filter(r => r.user_score != null).map(r => r.user_score!);
  const aScores = mrs.filter(r => r.arbiter_score != null).map(r => r.arbiter_score!);
  return { avgUser: avgOrNull(uScores), avgArbiter: avgOrNull(aScores) };
}

function modelCriteriaAvg(mrs: ContestResult[], allKeys: string[]): Record<string, number | null> {
  const result: Record<string, number | null> = {};
  for (const key of allKeys) {
    const vals = mrs
      .filter(r => r.criteria_scores && (r.criteria_scores as any)[key] != null)
      .map(r => (r.criteria_scores as any)[key] as number);
    result[key] = avgOrNull(vals);
  }
  return result;
}

function collectCriteriaKeys(results: ContestResult[]): string[] {
  return [...new Set(
    results
      .filter(r => r.criteria_scores && typeof r.criteria_scores === 'object')
      .flatMap(r => Object.keys(r.criteria_scores!))
  )];
}

function assignRanks(models: ScoredModel[]): ScoredModel[] {
  const sorted = [...models].sort((a, b) => b.finalScore - a.finalScore);
  sorted.forEach((m, i) => { m.rank = i + 1; });
  return sorted;
}

// ─── Weighted Average ───────────────────────────────────

function computeWeightedAvg(
  results: ContestResult[],
  userWeight: number,
  criteriaKeys: string[],
): ScoredModel[] {
  const arbiterWeight = 100 - userWeight;
  const grouped = groupByModel(results);
  const models: ScoredModel[] = [];

  for (const [modelId, mrs] of grouped) {
    const { avgUser, avgArbiter } = modelAvgScores(mrs);
    const weightedTotal = (avgUser ?? 0) * (userWeight / 100) + (avgArbiter ?? 0) * (arbiterWeight / 100);
    const hasScore = avgUser != null || avgArbiter != null;

    models.push({
      modelId,
      finalScore: hasScore ? weightedTotal : 0,
      rank: 0,
      avgUser,
      avgArbiter,
      details: { weightedTotal },
      criteriaAvg: modelCriteriaAvg(mrs, criteriaKeys),
    });
  }

  return assignRanks(models);
}

// ─── Tournament ─────────────────────────────────────────
// Pairwise comparison by per-round scores. For each round where both
// models have scores, the one with higher combined score wins.

function computeTournament(
  results: ContestResult[],
  userWeight: number,
  criteriaKeys: string[],
): ScoredModel[] {
  const arbiterWeight = 100 - userWeight;
  const grouped = groupByModel(results);
  const modelIds = [...grouped.keys()];

  // Per-round combined scores for each model
  type RoundScore = { roundId: string; combined: number };
  const modelRoundScores = new Map<string, RoundScore[]>();

  for (const [modelId, mrs] of grouped) {
    const roundScores: RoundScore[] = [];
    for (const r of mrs) {
      const u = r.user_score ?? 0;
      const a = r.arbiter_score ?? 0;
      if (r.user_score != null || r.arbiter_score != null) {
        roundScores.push({
          roundId: r.round_id,
          combined: u * (userWeight / 100) + a * (arbiterWeight / 100),
        });
      }
    }
    modelRoundScores.set(modelId, roundScores);
  }

  // Track W/D/L for each model
  const stats = new Map<string, { wins: number; draws: number; losses: number }>();
  for (const id of modelIds) stats.set(id, { wins: 0, draws: 0, losses: 0 });

  // Pairwise duels
  for (let i = 0; i < modelIds.length; i++) {
    for (let j = i + 1; j < modelIds.length; j++) {
      const a = modelIds[i];
      const b = modelIds[j];
      const aScores = modelRoundScores.get(a) || [];
      const bScores = modelRoundScores.get(b) || [];

      // Find common rounds
      const bByRound = new Map(bScores.map(s => [s.roundId, s.combined]));
      let aWins = 0, bWins = 0;

      for (const aS of aScores) {
        const bCombined = bByRound.get(aS.roundId);
        if (bCombined == null) continue;
        if (aS.combined > bCombined) aWins++;
        else if (bCombined > aS.combined) bWins++;
      }

      const sA = stats.get(a)!;
      const sB = stats.get(b)!;

      if (aWins > bWins) {
        sA.wins++;
        sB.losses++;
      } else if (bWins > aWins) {
        sB.wins++;
        sA.losses++;
      } else {
        sA.draws++;
        sB.draws++;
      }
    }
  }

  const models: ScoredModel[] = [];
  for (const [modelId, mrs] of grouped) {
    const { avgUser, avgArbiter } = modelAvgScores(mrs);
    const s = stats.get(modelId)!;
    const tournamentPoints = s.wins * 3 + s.draws * 1; // football-style scoring

    models.push({
      modelId,
      finalScore: tournamentPoints,
      rank: 0,
      avgUser,
      avgArbiter,
      details: {
        wins: s.wins,
        draws: s.draws,
        losses: s.losses,
        tournamentPoints,
      },
      criteriaAvg: modelCriteriaAvg(mrs, criteriaKeys),
    });
  }

  return assignRanks(models);
}

// ─── Elo ────────────────────────────────────────────────
// Classic Elo with K=32. Each round produces pairwise duels.

const ELO_INITIAL = 1500;
const ELO_K = 32;

function computeElo(
  results: ContestResult[],
  userWeight: number,
  criteriaKeys: string[],
): ScoredModel[] {
  const arbiterWeight = 100 - userWeight;
  const grouped = groupByModel(results);
  const modelIds = [...grouped.keys()];

  // Per-round combined scores
  const modelRoundScores = new Map<string, Map<string, number>>();
  for (const [modelId, mrs] of grouped) {
    const roundMap = new Map<string, number>();
    for (const r of mrs) {
      if (r.user_score != null || r.arbiter_score != null) {
        const u = r.user_score ?? 0;
        const a = r.arbiter_score ?? 0;
        roundMap.set(r.round_id, u * (userWeight / 100) + a * (arbiterWeight / 100));
      }
    }
    modelRoundScores.set(modelId, roundMap);
  }

  // Collect all round IDs in order
  const allRoundIds = [...new Set(results.map(r => r.round_id))];

  // Elo ratings
  const elo = new Map<string, number>();
  for (const id of modelIds) elo.set(id, ELO_INITIAL);

  // Process each round
  for (const roundId of allRoundIds) {
    // Get models that participated in this round
    const roundParticipants: { modelId: string; score: number }[] = [];
    for (const modelId of modelIds) {
      const score = modelRoundScores.get(modelId)?.get(roundId);
      if (score != null) {
        roundParticipants.push({ modelId, score });
      }
    }

    // Pairwise Elo updates
    for (let i = 0; i < roundParticipants.length; i++) {
      for (let j = i + 1; j < roundParticipants.length; j++) {
        const a = roundParticipants[i];
        const b = roundParticipants[j];

        const rA = elo.get(a.modelId)!;
        const rB = elo.get(b.modelId)!;

        const eA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
        const eB = 1 - eA;

        let sA: number, sB: number;
        if (a.score > b.score) { sA = 1; sB = 0; }
        else if (b.score > a.score) { sA = 0; sB = 1; }
        else { sA = 0.5; sB = 0.5; }

        elo.set(a.modelId, rA + ELO_K * (sA - eA));
        elo.set(b.modelId, rB + ELO_K * (sB - eB));
      }
    }
  }

  const models: ScoredModel[] = [];
  for (const [modelId, mrs] of grouped) {
    const { avgUser, avgArbiter } = modelAvgScores(mrs);
    const eloRating = Math.round(elo.get(modelId)!);

    models.push({
      modelId,
      finalScore: eloRating,
      rank: 0,
      avgUser,
      avgArbiter,
      details: {
        eloRating,
        eloInitial: ELO_INITIAL,
      },
      criteriaAvg: modelCriteriaAvg(mrs, criteriaKeys),
    });
  }

  return assignRanks(models);
}

// ─── Main dispatcher ────────────────────────────────────

export interface ScoringInput {
  results: ContestResult[];
  scheme: ScoringScheme;
  userWeight?: number; // 0-100, default 50
}

export function computeScores(input: ScoringInput): ScoredModel[] {
  const { results, scheme, userWeight = 50 } = input;
  if (results.length === 0) return [];

  const criteriaKeys = collectCriteriaKeys(results);

  switch (scheme) {
    case 'tournament':
      return computeTournament(results, userWeight, criteriaKeys);
    case 'elo':
      return computeElo(results, userWeight, criteriaKeys);
    case 'weighted-avg':
    default:
      return computeWeightedAvg(results, userWeight, criteriaKeys);
  }
}

export { collectCriteriaKeys };
