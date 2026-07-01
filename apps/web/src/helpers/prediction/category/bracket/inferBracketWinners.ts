import type {
    FifaBracketData,
    FifaBracketMatch,
    FifaBracketTeam,
} from '@/helpers/prediction/category/bracket/types.js';

/**
 * TEMPORARY — infer the advancing side for knockout matches the API reports as a draw.
 *
 * The bracket payload currently returns equal `scores` for matches decided by a penalty
 * shootout, without indicating which side advanced (e.g. r32-4 NED 1–1 MAR, won by MAR on
 * penalties). We approximate the winner by checking which of the match's two teams
 * reappears in the next-round match (feedsIntoMatchId).
 *
 * Returns a map of matchId → winner side (0 | 1). Matches with decisive scores, non-final
 * status, a null downstream target (e.g. the Final), or an ambiguous/empty downstream match
 * are omitted — the card then leaves both sides undimmed, the same as today.
 *
 * TODO: remove once the backend exposes penalty/winner data on the match itself.
 */
export function inferBracketWinners(data: FifaBracketData): Map<string, 0 | 1> {
    const matchById = new Map<string, FifaBracketMatch>();
    for (const round of data.rounds) {
        for (const match of round.matches) {
            matchById.set(match.id, match);
        }
    }

    const winners = new Map<string, 0 | 1>();

    for (const round of data.rounds) {
        for (const match of round.matches) {
            const side = inferWinnerSide(match, matchById);
            if (side !== null) winners.set(match.id, side);
        }
    }

    return winners;
}

function inferWinnerSide(match: FifaBracketMatch, matchById: Map<string, FifaBracketMatch>): 0 | 1 | null {
    // Only finalized draws need inference; decisive scores are handled by the card directly.
    if (match.status !== 'final') return null;
    const scores = match.scores;
    if (!scores || scores[0] !== scores[1]) return null;

    const targetId = match.feedsIntoMatchId;
    if (!targetId) return null; // no downstream match to infer from (e.g. the Final)
    const target = matchById.get(targetId);
    if (!target) return null;

    const [team0, team1] = match.teams;
    if (!team0 || !team1) return null;

    const side0 = target.teams.some((t) => t !== null && isSameTeam(team0, t));
    const side1 = target.teams.some((t) => t !== null && isSameTeam(team1, t));
    if (side0 && !side1) return 0;
    if (side1 && !side0) return 1;
    return null; // ambiguous (both/neither present, e.g. downstream not filled yet) — leave undecided
}

/** Equal on country code when both have one, otherwise fall back to the display name. */
function isSameTeam(a: FifaBracketTeam, b: FifaBracketTeam): boolean {
    if (a.countryCode && b.countryCode) return a.countryCode === b.countryCode;
    return a.name === b.name;
}
