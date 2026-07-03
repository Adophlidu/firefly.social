import type {
    FifaMatchResultData,
    FifaPenaltyKickStatus,
    PolymarketSportsEvent,
    PolymarketSportsScoreShow,
} from '@/providers/types/Firefly.js';
import type { PenaltyKickOutcome, PenaltyShootout, SportEventData, SportScore } from '@/types/prediction.js';

const FIFA_LIVE_STATUS = 'in_progress';

/** Map Sportmonks string kick status → the numeric 0|1|2 union the UI expects. */
export function mapFifaKickStatus(status: FifaPenaltyKickStatus): PenaltyKickOutcome {
    if (status === 'scored') return 1;
    if (status === 'missed') return 2;
    return 0;
}

/** Convert Sportmonks per-kick arrays to the UI shootout shape; `undefined` when no kicks data. */
export function toPenaltyShootout(
    kicks: { home: FifaPenaltyKickStatus[]; away: FifaPenaltyKickStatus[] } | null | undefined,
): PenaltyShootout | undefined {
    if (!kicks) return undefined;
    return {
        home: kicks.home.map(mapFifaKickStatus),
        away: kicks.away.map(mapFifaKickStatus),
    };
}

/** Index match-results by `event_slug` for O(1) lookup during the merge. */
export function indexFifaMatchResultsBySlug(matches: FifaMatchResultData[]): Map<string, FifaMatchResultData> {
    const map = new Map<string, FifaMatchResultData>();
    for (const match of matches) {
        const slug = match.event_slug?.trim();
        if (!slug) continue;
        if (!map.has(slug)) map.set(slug, match);
    }

    return map;
}

function isFifaScore(scores: [number | null, number | null] | null | undefined): scores is [number, number] {
    if (!scores) return false;
    const [home, away] = scores;
    return Number.isFinite(home) && Number.isFinite(away);
}

/** Override the latest score-show entry with the fresher FIFA score (same ref if unchanged). */
function overrideLiveScoreShow(
    scoreShow: PolymarketSportsScoreShow[] | undefined,
    fifaScores: [number, number],
): PolymarketSportsScoreShow[] | undefined {
    if (!scoreShow?.length) {
        return [{ score: [...fifaScores] }];
    }
    const lastIndex = scoreShow.length - 1;
    const last = scoreShow[lastIndex];
    if (last.score?.length === 2 && last.score[0] === fifaScores[0] && last.score[1] === fifaScores[1]) {
        return scoreShow;
    }
    const next = scoreShow.slice();
    next[lastIndex] = { ...last, score: [...fifaScores] };
    return next;
}

/** Inject `penaltyShootout` and override the live score on a list event (no-op if nothing to merge). */
export function enrichSportsEventWithFifa(
    event: PolymarketSportsEvent,
    fifa: FifaMatchResultData | undefined,
): PolymarketSportsEvent {
    if (!fifa) return event;

    const penaltyShootout = fifa.has_penalty_shootout
        ? (toPenaltyShootout(fifa.penalty_kicks) ?? { home: [], away: [] })
        : undefined;
    const liveScoreOverride = fifa.status === FIFA_LIVE_STATUS && isFifaScore(fifa.scores) ? fifa.scores : null;

    if (!penaltyShootout && !liveScoreOverride) return event;

    return {
        ...event,
        ...(penaltyShootout ? { penaltyShootout } : {}),
        ...(liveScoreOverride ? { score_show: overrideLiveScoreShow(event.score_show, liveScoreOverride) } : {}),
    };
}

/** Override the regulation score with the fresher FIFA score (same ref if unchanged). */
function overrideLiveSportScores(scores: SportScore[] | undefined, fifaScores: [number, number]): SportScore[] {
    if (scores?.length) {
        const first = scores[0];
        if (first.score?.length === 2 && first.score[0] === fifaScores[0] && first.score[1] === fifaScores[1]) {
            return scores;
        }
        const next = scores.slice();
        next[0] = { ...first, score: [...fifaScores] };
        return next;
    }
    return [{ score: [...fifaScores] }];
}

/** Inject `penaltyShootout` and override the live score on a detail event (no-op if nothing to merge). */
export function overlaySportEventDataWithFifa(
    data: SportEventData,
    fifa: FifaMatchResultData | undefined,
): SportEventData {
    if (!fifa) return data;

    const penaltyShootout = fifa.has_penalty_shootout
        ? (toPenaltyShootout(fifa.penalty_kicks) ?? { home: [], away: [] })
        : undefined;
    const liveScoreOverride = fifa.status === FIFA_LIVE_STATUS && isFifaScore(fifa.scores) ? fifa.scores : null;

    if (!penaltyShootout && !liveScoreOverride) return data;

    return {
        ...data,
        ...(penaltyShootout ? { penaltyShootout } : {}),
        ...(liveScoreOverride ? { scores: overrideLiveSportScores(data.scores, liveScoreOverride) } : {}),
    };
}
