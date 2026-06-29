import type {
    FifaBracketData,
    FifaBracketMatch,
    FifaBracketRound,
    FifaBracketRoundId,
    FifaBracketTeam,
} from '@/helpers/prediction/category/bracket/types.js';

const ROUND_IDS: readonly FifaBracketRoundId[] = ['r32', 'r16', 'qf', 'sf', 'final'];

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function normalizeTeam(raw: unknown): FifaBracketTeam | null {
    if (!isObject(raw)) return null;
    const { name, country_code, flag_url, team_color } = raw;
    if (typeof name !== 'string') return null;
    return {
        name,
        countryCode: typeof country_code === 'string' ? country_code : '',
        // Flag URLs may contain literal spaces — encode for safe <img src> without breaking path structure.
        flagUrl: typeof flag_url === 'string' ? encodeURI(flag_url) : '',
        teamColor: typeof team_color === 'string' ? team_color : '',
    };
}

function normalizeTuple<T>(raw: unknown, map: (v: unknown) => T): [T, T] | null {
    if (!Array.isArray(raw) || raw.length < 2) return null;
    return [map(raw[0]), map(raw[1])];
}

function normalizeMatch(raw: unknown): FifaBracketMatch | null {
    if (!isObject(raw) || typeof raw.id !== 'string') return null;
    const roundId = ROUND_IDS.includes(raw.round_id as FifaBracketRoundId)
        ? (raw.round_id as FifaBracketRoundId)
        : null;
    if (!roundId) return null;

    const teams = normalizeTuple(raw.teams, (v) => normalizeTeam(v)) ?? [null, null];
    const marketSlugs = normalizeTuple(raw.market_slugs, (v) => (typeof v === 'string' ? v : null)) ?? [null, null];
    const rawScores = normalizeTuple(raw.scores, (v) => (typeof v === 'number' ? v : NaN));
    // Inner-null collapse: a non-finite side score invalidates the whole tuple (null = not finalized).
    const scores: [number, number] | null = rawScores?.every((s) => Number.isFinite(s))
        ? (rawScores as [number, number])
        : null;

    return {
        id: raw.id,
        roundId,
        startTime: typeof raw.start_time === 'string' && raw.start_time.length > 0 ? raw.start_time : null,
        status: typeof raw.status === 'string' ? raw.status : 'tbd',
        teams,
        scores,
        marketSlugs,
        eventSlug: typeof raw.event_slug === 'string' ? raw.event_slug : null,
        feedsIntoMatchId: typeof raw.feeds_into_match_id === 'string' ? raw.feeds_into_match_id : null,
    };
}

/**
 * Convert the backend snake_case DTO into the stable camelCase {@link FifaBracketData} contract.
 * Always returns a valid object; malformed input yields empty rounds so the UI degrades to an
 * empty state instead of throwing.
 */
export function normalizeFifaBracketDto(raw: unknown): FifaBracketData {
    if (!isObject(raw) || !Array.isArray(raw.rounds)) return { rounds: [], updatedAt: null };

    const rounds: FifaBracketRound[] = [];
    for (const rawRound of raw.rounds) {
        if (!isObject(rawRound) || !ROUND_IDS.includes(rawRound.id as FifaBracketRoundId)) continue;
        const matches = Array.isArray(rawRound.matches)
            ? rawRound.matches.map(normalizeMatch).filter((m): m is FifaBracketMatch => m !== null)
            : [];
        rounds.push({ id: rawRound.id as FifaBracketRoundId, matches });
    }

    const updatedAt = typeof raw.updated_at === 'string' && raw.updated_at.length > 0 ? raw.updated_at : null;
    return { rounds, updatedAt };
}
