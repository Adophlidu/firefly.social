/** Data round ids emitted by the backend (GET /v1/fifa/bracket). 'third' = third-place play-off. */
export type FifaBracketRoundId = 'r32' | 'r16' | 'qf' | 'sf' | 'final' | 'third';

/** UI column ids. 'third' folds into the 'final' column; 'champion' is UI-only (no API backing). */
export type BracketColumnId = 'r32' | 'r16' | 'qf' | 'sf' | 'final' | 'champion';

export interface FifaBracketTeam {
    countryCode: string;
    /** Polymarket's English country name; localized client-side. */
    name: string;
    flagUrl: string;
    teamColor: string;
}

export interface FifaBracketMatch {
    id: string;
    roundId: FifaBracketRoundId;
    /** Normalized ISO 8601 (with -04:00 offset), or null when unknown. */
    startTime: string | null;
    status: string;
    teams: [FifaBracketTeam | null, FifaBracketTeam | null];
    scores: [number, number] | null;
    marketSlugs: [string | null, string | null];
    eventSlug: string | null;
    /** Tree connectivity: id of the next-round match this winner feeds. */
    feedsIntoMatchId: string | null;
}

export interface FifaBracketRound {
    id: FifaBracketRoundId;
    matches: FifaBracketMatch[];
}

export interface FifaBracketData {
    rounds: FifaBracketRound[];
    updatedAt: string | null;
}
