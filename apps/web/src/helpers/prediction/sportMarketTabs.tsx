import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';

import type { BetsMarketDataForUI, SportTeam } from '@/types/prediction.js';
import { SportMarketGroupType } from '@/types/prediction.js';

export interface SportMarketResolvedSection {
    /** The sportsMarketType value this section groups. */
    sportsMarketType: string;
    /** Section title (i18n). */
    title: React.ReactNode;
    /** Markets belonging to this section. */
    markets: BetsMarketDataForUI[];
    /** Whether to enable line switcher (auto-detected: true when multiple different lines). */
    mergeByLine: boolean;
    /** Rendering hint for button labels and styling. */
    renderAs: SportMarketGroupType;
}

export interface SportMarketResolvedTab {
    /** Unique key for URL state. */
    key: string;
    /** i18n tab title. */
    title: React.ReactNode;
    /** Resolved sections with their markets. */
    sections: SportMarketResolvedSection[];
}

// Each rule maps a sportsMarketType pattern to a sport-specific tab.
// Markets NOT matching any rule go to the default "Game Lines" / "Series Lines" tab.

interface TabRule {
    /** Pattern to match against sportsMarketType (case-insensitive). */
    pattern: RegExp;
    /** Derive tab key from the match. */
    getKey: (match: RegExpMatchArray) => string;
    /** Derive tab title from the match. */
    getTitle: (match: RegExpMatchArray) => React.ReactNode;
    /** Sort priority (lower = earlier in tab bar). For dynamic game/map tabs, scaled by number. */
    getPriority: (match: RegExpMatchArray) => number;
}

const TAB_RULES: TabRule[] = [
    // Soccer: Exact Score
    {
        pattern: /^soccer_exact_score$/i,
        getKey: () => 'exact-score',
        getTitle: () => <Trans>Exact Score</Trans>,
        getPriority: () => 100,
    },
    // Soccer: Halftime (halftime result + first/second half BTTS + first/second half team totals + second half result)
    {
        pattern:
            /^soccer_halftime_result$|^soccer_second_half_result$|^both_teams_to_score_first_half$|^both_teams_to_score_second_half$|^soccer_first_half_team_totals$|^soccer_second_half_team_totals$/i,
        getKey: () => 'halftime',
        getTitle: () => <Trans>Halftime</Trans>,
        getPriority: () => 200,
    },
    // Soccer: Corners (match corners, 1st/2nd half corners, team corners, corners odd/even, first corner)
    {
        pattern:
            /^total_corners$|^soccer_(?:first_half_total_corners|second_half_total_corners|team_total_corners|game_corners_odd_even|first_corner)$/i,
        getKey: () => 'corners',
        getTitle: () => <Trans>Corners</Trans>,
        getPriority: () => 300,
    },
    // Soccer: Goals (player props)
    {
        pattern: /^soccer_player_goals$/i,
        getKey: () => 'goals',
        getTitle: () => <Trans>Goals</Trans>,
        getPriority: () => 400,
    },
    // Soccer: Assists (player props)
    {
        pattern: /^soccer_player_assists$/i,
        getKey: () => 'assists',
        getTitle: () => <Trans>Assists</Trans>,
        getPriority: () => 500,
    },
    // Soccer: Shots (player props)
    {
        pattern: /^soccer_player_shots$/i,
        getKey: () => 'shots',
        getTitle: () => <Trans>Shots</Trans>,
        getPriority: () => 600,
    },
    // Tennis: Sets (all tennis_1st_set_*, tennis_first_set_*, tennis_set_winner, tennis_set_games_totals)
    {
        pattern: /^tennis_(?:(?:1st|first)_set|set_winner|set_games_totals)/i,
        getKey: () => 'sets',
        getTitle: () => <Trans>Sets</Trans>,
        getPriority: () => 100,
    },
    // Esports: per-game tabs (game_1_*, game_2_*, etc.)
    {
        pattern: /^game_(\d+)_/i,
        getKey: (m) => `game-${m[1]}`,
        getTitle: (m) => <Trans>Game {m[1]}</Trans>,
        getPriority: (m) => 100 + Number(m[1]) * 10,
    },
    // Esports: per-map tabs (map_1_*, map_2_*, etc.)
    {
        pattern: /^map_(\d+)_/i,
        getKey: (m) => `map-${m[1]}`,
        getTitle: (m) => <Trans>Map {m[1]}</Trans>,
        getPriority: (m) => 100 + Number(m[1]) * 10,
    },
    // Basketball: 1st Half
    {
        pattern: /^first_half_/i,
        getKey: () => 'first-half',
        getTitle: () => <Trans>1st Half</Trans>,
        getPriority: () => 50,
    },
    // Basketball: per-quarter tabs (q1_*, q2_*, etc.)
    {
        pattern: /^q(\d+)_/i,
        getKey: (m) => `q${m[1]}`,
        getTitle: (m) => <Trans>Q{m[1]}</Trans>,
        getPriority: (m) => 60 + Number(m[1]) * 5,
    },
    // Basketball: player props — order matches Polymarket: Points, Assists, Rebounds
    {
        pattern: /^points$/i,
        getKey: () => 'points',
        getTitle: () => <Trans>Points</Trans>,
        getPriority: () => 100,
    },
    {
        pattern: /^assists$/i,
        getKey: () => 'assists',
        getTitle: () => <Trans>Assists</Trans>,
        getPriority: () => 110,
    },
    {
        pattern: /^rebounds$/i,
        getKey: () => 'rebounds',
        getTitle: () => <Trans>Rebounds</Trans>,
        getPriority: () => 120,
    },
    {
        pattern: /^threes$/i,
        getKey: () => 'threes',
        getTitle: () => <Trans>Threes</Trans>,
        getPriority: () => 130,
    },
];

interface SectionConfig {
    title?: React.ReactNode;
    renderAs?: SportMarketGroupType;
    /** Hint for mergeByLine; auto-detected at runtime if omitted. */
    mergeByLine?: boolean;
}

function getSectionConfig(type: string): SectionConfig {
    switch (type) {
        // Generic types (appear in default tab)
        case 'moneyline':
            return { title: <Trans>Moneyline</Trans>, renderAs: SportMarketGroupType.Moneyline };
        case 'spreads':
            return { title: <Trans>Spreads</Trans>, renderAs: SportMarketGroupType.Spread, mergeByLine: true };
        case 'totals':
            return { title: <Trans>Totals</Trans>, renderAs: SportMarketGroupType.Total, mergeByLine: true };
        case 'both_teams_to_score':
            return { title: <Trans>Both Teams To Score</Trans> };
        case 'both_teams_to_score_first_half':
            return { title: <Trans>Both Teams To Score - 1st Half</Trans> };
        case 'set_handicap':
            return { title: <Trans>Set Handicap</Trans>, renderAs: SportMarketGroupType.Spread };
        case 'total_sets':
            return { title: <Trans>Total Sets</Trans>, renderAs: SportMarketGroupType.Total };
        case 'total_games':
            return { title: <Trans>Total Games</Trans>, renderAs: SportMarketGroupType.Total, mergeByLine: true };
        case 'completed_match':
            return { title: <Trans>Completed Match</Trans> };
        case 'nrfi':
        case 'yrfi':
            return { title: <Trans>Will there be a run in the first inning?</Trans> };
        case 'game_winner':
            return { title: <Trans>Game Winner</Trans>, renderAs: SportMarketGroupType.Spread, mergeByLine: true };
        case 'game_handicap':
            return { title: <Trans>Game Handicap</Trans>, renderAs: SportMarketGroupType.Spread };
        case 'total_maps':
            return { title: <Trans>Total Maps</Trans>, renderAs: SportMarketGroupType.Total };
        case 'map_winner':
            return { title: <Trans>Map Winner</Trans>, renderAs: SportMarketGroupType.Spread, mergeByLine: true };
        case 'map_handicap':
            // Title resolved dynamically in buildResolvedSections (context-dependent: "Game Handicap" vs "Map Handicap")
            return { renderAs: SportMarketGroupType.Spread, mergeByLine: true };

        // Football/Soccer team totals — split by team name at render time
        case 'team_totals':
        case 'soccer_team_totals':
            return { renderAs: SportMarketGroupType.Total, mergeByLine: true };
        case 'first_half_team_totals':
        case 'soccer_first_half_team_totals':
            return { renderAs: SportMarketGroupType.Total, mergeByLine: true };
        case 'soccer_second_half_team_totals':
            return { renderAs: SportMarketGroupType.Total, mergeByLine: true };

        // Soccer-specific (some API responses prefix types with soccer_)
        case 'soccer_moneyline':
            return { title: <Trans>Moneyline</Trans>, renderAs: SportMarketGroupType.Moneyline };
        case 'soccer_spreads':
            return { title: <Trans>Spreads</Trans>, renderAs: SportMarketGroupType.Spread, mergeByLine: true };
        case 'soccer_totals':
            return { title: <Trans>Totals</Trans>, renderAs: SportMarketGroupType.Total, mergeByLine: true };
        case 'soccer_both_teams_to_score':
            return { title: <Trans>Both Teams To Score</Trans> };
        case 'soccer_exact_score':
            return { title: <Trans>Exact Score</Trans> };
        case 'soccer_halftime_result':
            return { title: <Trans>Halftime Result</Trans>, renderAs: SportMarketGroupType.Moneyline };
        case 'soccer_second_half_result':
            return { title: <Trans>2nd Half Result</Trans>, renderAs: SportMarketGroupType.Moneyline };
        case 'second_half_totals':
            return { title: <Trans>2nd Half Totals</Trans>, renderAs: SportMarketGroupType.Total, mergeByLine: true };
        case 'both_teams_to_score_second_half':
            return { title: <Trans>Both Teams To Score - 2nd Half</Trans> };
        case 'soccer_first_to_score':
            return { title: <Trans>First Team to Score</Trans>, renderAs: SportMarketGroupType.Moneyline };

        // Soccer: Corners
        case 'total_corners':
            return { title: <Trans>Corners</Trans>, renderAs: SportMarketGroupType.Total, mergeByLine: true };
        case 'soccer_first_half_total_corners':
            return { title: <Trans>1st Half Corners</Trans>, renderAs: SportMarketGroupType.Total, mergeByLine: true };
        case 'soccer_second_half_total_corners':
            return { title: <Trans>2nd Half Corners</Trans>, renderAs: SportMarketGroupType.Total, mergeByLine: true };
        case 'soccer_team_total_corners':
            return { renderAs: SportMarketGroupType.Total, mergeByLine: true };
        case 'soccer_game_corners_odd_even':
            return { title: <Trans>Corners Odd/Even</Trans> };
        case 'soccer_first_corner':
            return { title: <Trans>First Corner</Trans>, renderAs: SportMarketGroupType.Moneyline };

        // Tennis-specific (some API responses prefix types with tennis_)
        case 'tennis_moneyline':
            return { title: <Trans>Moneyline</Trans>, renderAs: SportMarketGroupType.Moneyline };
        case 'tennis_spreads':
            return { title: <Trans>Spreads</Trans>, renderAs: SportMarketGroupType.Spread, mergeByLine: true };
        case 'tennis_set_handicap':
            return { title: <Trans>Set Handicap</Trans>, renderAs: SportMarketGroupType.Spread };
        case 'tennis_total_sets':
            return { title: <Trans>Total Sets</Trans>, renderAs: SportMarketGroupType.Total };
        case 'tennis_total_games':
            return { title: <Trans>Total Games</Trans>, renderAs: SportMarketGroupType.Total, mergeByLine: true };
        case 'tennis_completed_match':
            return { title: <Trans>Completed Match</Trans> };
        case 'tennis_1st_set_winner':
        case 'tennis_first_set_winner':
            return { title: <Trans>1st Set Winner</Trans>, renderAs: SportMarketGroupType.Moneyline };
        case 'tennis_1st_set_total_games':
        case 'tennis_first_set_totals':
            return {
                title: <Trans>1st Set Total Games</Trans>,
                renderAs: SportMarketGroupType.Total,
                mergeByLine: true,
            };
        // Tennis - actual API naming (tennis_set_totals, tennis_match_totals)
        case 'tennis_set_totals':
            return { title: <Trans>Total Sets</Trans>, renderAs: SportMarketGroupType.Total };
        case 'tennis_match_totals':
            return { title: <Trans>Total Games</Trans>, renderAs: SportMarketGroupType.Total, mergeByLine: true };
        // Tennis: Set 2+ winner (set number extracted from groupItemTitle at render time)
        case 'tennis_set_winner':
            return { renderAs: SportMarketGroupType.Moneyline };
        // Tennis: Set 2+ games totals (set number extracted from groupItemTitle at render time)
        case 'tennis_set_games_totals':
            return { renderAs: SportMarketGroupType.Total, mergeByLine: true };

        // Basketball first-half
        case 'first_half_moneyline':
            return { title: <Trans>1H Moneyline</Trans>, renderAs: SportMarketGroupType.Moneyline };
        case 'first_half_spreads':
            return { title: <Trans>Spreads</Trans>, renderAs: SportMarketGroupType.Spread, mergeByLine: true };
        case 'first_half_totals':
            return { title: <Trans>1H Totals</Trans>, renderAs: SportMarketGroupType.Total, mergeByLine: true };

        // Basketball quarters
        case 'q1_moneyline':
        case 'q2_moneyline':
        case 'q3_moneyline':
        case 'q4_moneyline':
            return { renderAs: SportMarketGroupType.Moneyline };
        case 'q1_spreads':
        case 'q2_spreads':
        case 'q3_spreads':
        case 'q4_spreads':
            return { renderAs: SportMarketGroupType.Spread, mergeByLine: true };
        case 'q1_totals':
        case 'q2_totals':
        case 'q3_totals':
        case 'q4_totals':
            return { renderAs: SportMarketGroupType.Total, mergeByLine: true };

        // Dota 2 fun markets (base types; game-prefixed versions route to "Game N" tabs)
        case 'dota2_game_ends_daytime':
        case 'ends_in_daytime':
            return { title: <Trans>Ends in Daytime</Trans> };
        case 'dota2_both_teams_roshan':
        case 'both_teams_beat_roshan':
            return { title: <Trans>Both Teams Beat Roshan</Trans> };
        case 'dota2_both_teams_barracks':
        case 'both_teams_destroy_barracks':
            return { title: <Trans>Both Teams Destroy Barracks</Trans> };
        case 'dota2_ultra_kill':
        case 'any_player_ultra_kill':
            return { title: <Trans>Any Player Ultra Kill</Trans> };
        case 'dota2_rampage':
        case 'any_player_rampage':
            return { title: <Trans>Any Player Rampage</Trans> };

        // Shared esports fun markets (per-game)
        case 'first_blood_game':
            return { title: <Trans>First Blood</Trans> };
        case 'kill_over_under_game':
            return { title: <Trans>Kill Totals</Trans>, renderAs: SportMarketGroupType.Total };

        // Esports series-level types (displayed in Series Lines tab)
        case 'child_moneyline':
            return { title: <Trans>Game N Winner</Trans>, renderAs: SportMarketGroupType.Moneyline, mergeByLine: true };

        // CS2/Valorant series-level types
        case 'round_handicap_match':
            return { title: <Trans>Round Handicap</Trans>, renderAs: SportMarketGroupType.Spread };
        case 'round_over_under_match':
            return { title: <Trans>Round Total</Trans>, renderAs: SportMarketGroupType.Total };
        case 'shooter_rounds_total':
            return { title: <Trans>Total Rounds</Trans>, renderAs: SportMarketGroupType.Total };

        // LoL series-level types
        case 'lol_both_teams_baron':
            return { title: <Trans>Both Teams Slay Baron</Trans> };
        case 'lol_both_teams_dragon':
            return { title: <Trans>Both Teams Slay Dragon</Trans> };
        case 'lol_both_teams_inhibitors':
            return { title: <Trans>Both Teams Destroy Inhibitors</Trans> };
        case 'lol_quadra_kill':
            return { title: <Trans>Any Player Quadra Kill</Trans> };
        case 'lol_penta_kill':
            return { title: <Trans>Any Player Penta Kill</Trans> };
        case 'lol_odd_even_total_kills':
            return { title: <Trans>Odd/Even Total Kills</Trans> };

        // LoL / Dota base types (prefix stripped for per-game tab routing)
        case 'both_teams_baron':
            return { title: <Trans>Both Teams Slay Baron</Trans> };
        case 'both_teams_dragon':
            return { title: <Trans>Both Teams Slay Dragon</Trans> };
        case 'both_teams_inhibitors':
            return { title: <Trans>Both Teams Destroy Inhibitors</Trans> };
        case 'quadra_kill':
            return { title: <Trans>Any Player Quadra Kill</Trans> };
        case 'penta_kill':
            return { title: <Trans>Any Player Penta Kill</Trans> };
        case 'odd_even_total_kills':
            return { title: <Trans>Odd/Even Total Kills</Trans> };
        case 'first_blood':
            return { title: <Trans>First Blood</Trans> };
        case 'total_rounds':
            return { title: <Trans>Total Rounds</Trans>, renderAs: SportMarketGroupType.Total, mergeByLine: true };
        case 'round_handicap':
            return { title: <Trans>Round Handicap</Trans>, renderAs: SportMarketGroupType.Spread };

        // CS2 series-level types
        case 'cs2_odd_even_total_kills':
            return { title: <Trans>Odd/Even Total Kills</Trans> };
        case 'cs2_odd_even_total_rounds':
            return { title: <Trans>Odd/Even Total Rounds</Trans> };

        // Generic esports series-level handicap / "most" types
        case 'kill_handicap_match':
            return { title: <Trans>Kill Handicap</Trans>, renderAs: SportMarketGroupType.Spread };
        case 'tower_handicap_match':
            return { title: <Trans>Tower Handicap</Trans>, renderAs: SportMarketGroupType.Spread };
        case 'drake_handicap_match':
            return { title: <Trans>Drake Handicap</Trans>, renderAs: SportMarketGroupType.Spread };
        case 'nashor_handicap_match':
            return { title: <Trans>Nashor Handicap</Trans>, renderAs: SportMarketGroupType.Spread };
        case 'inhibitor_handicap_match':
            return { title: <Trans>Inhibitor Handicap</Trans>, renderAs: SportMarketGroupType.Spread };
        case 'barrack_handicap_match':
            return { title: <Trans>Barrack Handicap</Trans>, renderAs: SportMarketGroupType.Spread };
        case 'kill_most_2_way_match':
            return { title: <Trans>Most Kills</Trans> };
        case 'tower_most_2_way_match':
            return { title: <Trans>Most Towers</Trans> };
        case 'drake_most_2_way_match':
            return { title: <Trans>Most Drakes</Trans> };
        case 'nashor_most_2_way_match':
            return { title: <Trans>Most Nashors</Trans> };
        case 'inhibitor_most_2_way_match':
            return { title: <Trans>Most Inhibitors</Trans> };
        case 'barrack_most_2_way_match':
            return { title: <Trans>Most Barracks</Trans> };

        // UFC
        case 'ufc_go_the_distance':
            return { title: <Trans>Go the Distance?</Trans> };
        case 'ufc_method_of_victory':
            return { title: <Trans>Method of Victory</Trans> };

        default:
            return {};
    }
}

/** Infer renderAs from keywords in the type string. */
export function inferRenderAs(type: string): SportMarketGroupType {
    const t = type.toLowerCase();
    if (t.includes('moneyline') || t.includes('winner')) return SportMarketGroupType.Moneyline;
    if (t.includes('spread') || t.includes('handicap')) return SportMarketGroupType.Spread;
    if (t.includes('total') || t.includes('over_under')) return SportMarketGroupType.Total;
    return SportMarketGroupType.Other;
}

/** Human-readable fallback for unknown types. */
function humanizeType(type: string): string {
    return type
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Market types where each market is rendered as its own section (e.g. each exact score).
 * Similar to player props — one section per market with the market's title.
 */
const PER_MARKET_TYPES = new Set(['soccer_exact_score']);

/** Basketball player prop types: each market is a different player → one section per market. */
const PLAYER_PROP_TYPES = new Set(['points', 'rebounds', 'assists', 'threes']);

/** Soccer player prop types: each market is a different player → one section per market. */
const SOCCER_PLAYER_PROP_TYPES = new Set(['soccer_player_goals', 'soccer_player_assists', 'soccer_player_shots']);

/** Market types that Polymarket ignores (not rendered). */
const IGNORED_TYPES = new Set([
    // Basketball
    'basketball_team_to_score_first',
    'basketball_odd_even',
    'points_assists_rebounds',
    'first_half_spreads',
    // Polymarket IGNORED_SPORTS_MARKET_TYPES
    'passing_yards',
    'two_plus_touchdowns',
    'map_participant_win_one',
    'map_participant_win_total',
    'cricket_first_inning_runs',
    'cricket_second_inning_runs',
    'soccer_team_to_advance',
    'firsts',
    'q1_team_totals',
    'q1_totals',
    'hits',
    'rbis',
    'home_runs',
    'round_handicap_game_4',
    'round_handicap_game_5',
    'round_handicap_game_6',
    'round_handicap_game_7',
    'round_over_under_game_4',
    'round_over_under_game_5',
    'round_over_under_game_6',
    'round_over_under_game_7',
    'soccer_player_goalkeeper_saves',
    'soccer_player_goals_plus_assists',
    'soccer_player_shots_on_target',
    'table_tennis_match_totals',
    'table_tennis_game_handicap',
]);

/** Team totals types: markets must be split by team name and deduplicated by line. */
const TEAM_TOTALS_TYPES = new Set([
    'team_totals',
    'first_half_team_totals',
    'soccer_team_totals',
    'soccer_first_half_team_totals',
    'soccer_second_half_team_totals',
]);

/** Soccer team corners types: markets must be split by team name and deduplicated by line. */
const SOCCER_TEAM_CORNERS_TYPES = new Set(['soccer_team_total_corners']);

/** Tennis set types: markets must be split by set number (extracted from groupItemTitle). */
const TENNIS_SET_SPLIT_TYPES = new Set(['tennis_set_winner', 'tennis_set_games_totals']);

/** Known esport prefixes in sportsMarketType (e.g. "lol_both_teams_baron"). */
const ESPORT_PREFIXES = ['lol_', 'cs2_', 'valorant_', 'dota2_', 'counter_strike_'];

/** Map prefix to game/map terminology for tab labels. */
const ESPORT_PREFIX_TERM: Record<string, 'game' | 'map'> = {
    lol: 'game',
    cs2: 'map',
    valorant: 'map',
    dota2: 'game',
    counter_strike: 'map',
};

/** Detect esport prefix from a sportsMarketType string. Returns the prefix key (e.g. "lol") or null. */
function detectEsportPrefix(type: string): string | null {
    const lower = type.toLowerCase();
    for (const prefix of ESPORT_PREFIXES) {
        if (lower.startsWith(prefix)) {
            return prefix.replace(/_$/, ''); // "lol_" → "lol", "dota2_" → "dota2"
        }
    }

    return null;
}

/** Parse the game/map number for an esport market, locale-independently when possible.
 *  Order: sportsMarketType (game_1_winner, map_2_handicap, round_handicap_game_3, game_4_lol_…)
 *  → slug (…-game-1-…, …-map-2-…) → English question/title text ("Game 1: …"). */
export function parseGameNumberFromQuestion(market: BetsMarketDataForUI): number | null {
    const type = market.sportsMarketType?.toLowerCase() || '';
    const typeNum = type.match(/^(?:game|map)_(\d+)(?:_|$)/)?.[1] || type.match(/_(?:game|map)_(\d+)(?:_|$)/)?.[1];
    if (typeNum) return Number(typeNum);

    const slugNum = market.slug?.toLowerCase().match(/(?:^|-)(?:game|map)-(\d+)(?:-|$)/)?.[1];
    if (slugNum) return Number(slugNum);

    // Fallback: English question/title text (translated titles won't match).
    const sources = compact([market.question, market.groupItemTitle, market.title]);
    for (const source of sources) {
        const match = source.match(/(?:Map|Game)\s+(\d+)/i);
        if (match) return Number(match[1]);
    }

    return null;
}

/** Extract the set number for a tennis market, locale-independently when possible.
 *  Order: slug (…-set-2-…) → English question text ("Set 2 Winner") → groupItemTitle/title. */
export function extractSetNumber(market: BetsMarketDataForUI): number | null {
    const slugSet = market.slug?.toLowerCase().match(/(?:^|-)set-?(\d+)(?:-|$)/)?.[1];
    if (slugSet) return Number(slugSet);

    // question is English on the Gamma path; groupItemTitle/title may be translated.
    const sources = [market.question, market.groupItemTitle, market.title].filter((s): s is string => Boolean(s));
    for (const source of sources) {
        const match = source.match(/Set\s+(\d+)/i);
        if (match) return Number(match[1]);
    }

    return null;
}

/**
 * Identify which team a team-totals / team-corners market belongs to.
 *
 * The localized `groupItemTitle` is unreliable: in one zh response the same team can
 * surface as "卡塔尔 大/小 0.5", "卡塔尔 O/U 1.5", and "Qatar O/U 2.5", so a title regex
 * would split one team into several sections. The slug is locale-independent and encodes
 * the side as a `-home-`/`-away-` segment (e.g. "...-team-total-home-0pt5",
 * "...-corners-team-away-5pt5"). Resolve that to the team name; fall back to the English
 * title regex for types whose slug lacks the side segment.
 */
export function extractTeamName(
    market: BetsMarketDataForUI,
    homeTeam?: SportTeam,
    awayTeam?: SportTeam,
): string | undefined {
    const side = market.slug?.toLowerCase().match(/-(home|away)-/)?.[1];
    if (side === 'home') return homeTeam?.name || homeTeam?.abbreviation || 'Home';
    if (side === 'away') return awayTeam?.name || awayTeam?.abbreviation || 'Away';

    // Fallback: English title like "Argentina O/U 0.5" (non-soccer team_totals).
    const source = market.groupItemTitle || market.title || '';
    return source.match(/^(.+?)\s+(?:O\/U|Over\/Under|Team Total)/i)?.[1]?.trim();
}

/** Extract a player's display name from the market title/question — text before the first colon.
 *  Handles both half-width ":" and full-width "：" (zh titles use "："). */
export function extractPlayerName(market: BetsMarketDataForUI): string {
    const source = market.question || market.title || '';
    const idx = source.search(/[:：]/);
    return idx === -1 ? source : source.slice(0, idx).trim();
}

/** Stable, locale-independent key for grouping a player's prop markets together.
 *  The slug is consistent ("...-goals-dan-ndoye-gte1/2/3"); the title is not (mixed language +
 *  colon width). Strip the trailing "-gteN" threshold so all of a player's lines collapse to one
 *  key. Falls back to the title-derived name when the slug lacks the threshold suffix. */
export function playerGroupKey(market: BetsMarketDataForUI): string {
    if (market.slug && /-gte\d+$/.test(market.slug)) return market.slug.replace(/-gte\d+$/, '');
    return extractPlayerName(market);
}

/**
 * Desired section ordering — matches Polymarket's SPORTS_GAME_LINE_MARKET_TYPES order:
 * moneyline → spreads → winner (Game N / 1st Set) → handicap → totals → rest
 */
const SECTION_PRIORITY = ['moneyline', 'result', 'spreads', 'winner', 'handicap', 'totals'];

/**
 * Normalize per-game/map winner and handicap market types into their
 * canonical form so they all merge into a single section in the default tab.
 *
 * - `game_1_winner` → `game_winner`
 * - `map_2_winner`  → `map_winner`
 * - `game_1_handicap` → `game_handicap`
 * - `map_2_handicap`  → `map_handicap`
 *
 * Other types (including fun markets like `game_1_ends_in_daytime`) pass through unchanged.
 */
function normalizeSeriesType(type: string): string {
    return type
        .replace(/^game_\d+_winner$/, 'game_winner')
        .replace(/^map_\d+_winner$/, 'map_winner')
        .replace(/^game_\d+_handicap$/, 'game_handicap')
        .replace(/^map_\d+_handicap$/, 'map_handicap')
        .replace(/^child_moneyline$/, 'game_winner');
}

/**
 * Derive tabs directly from market data by inspecting sportsMarketType values.
 * Each market is assigned to a tab via pattern rules; unmatched markets go to
 * the default "Game Lines" (or "Series Lines" for esports) tab.
 *
 * Sections within each tab are grouped by sportsMarketType, with mergeByLine
 * auto-detected when multiple markets share a type with different line values.
 */
export function getSportMarketTabs(
    markets: BetsMarketDataForUI[],
    homeTeam?: SportTeam,
    awayTeam?: SportTeam,
): SportMarketResolvedTab[] {
    if (!markets.length) return [];

    // Phase 1: Assign each market to a tab + group by sportsMarketType within that tab
    const tabMap = new Map<
        string,
        {
            key: string;
            title: React.ReactNode;
            priority: number;
            sectionsByType: Map<string, BetsMarketDataForUI[]>;
        }
    >();

    const defaultSectionsByType = new Map<string, BetsMarketDataForUI[]>();

    // Detect soccer events: Polymarket routes first_half_totals to "halftime" for soccer
    // (instead of creating a separate "1st Half" tab like basketball).
    const isSoccerEvent = markets.some((m) => m.sportsMarketType?.toLowerCase().startsWith('soccer_'));

    for (const market of markets) {
        let type = market.sportsMarketType?.toLowerCase();
        if (!type) continue;

        // Skip market types that should not be rendered
        if (IGNORED_TYPES.has(type)) continue;

        // Per-game round markets (CS2/Valorant): route to per-map tabs
        // round_handicap_game_N → map-N tab, section type: round_handicap
        // round_over_under_game_N → map-N tab, section type: total_rounds
        const roundGameMatch = type.match(/^round_(handicap|over_under)_game_(\d+)$/);
        if (roundGameMatch) {
            const kind = roundGameMatch[1]; // "handicap" or "over_under"
            const gameNum = Number(roundGameMatch[2]);
            const sectionType = kind === 'handicap' ? 'round_handicap' : 'total_rounds';
            const tabKey = `map-${gameNum}`;
            if (!tabMap.has(tabKey)) {
                tabMap.set(tabKey, {
                    key: tabKey,
                    title: <Trans>Map {gameNum}</Trans>,
                    priority: 100 + gameNum * 10,
                    sectionsByType: new Map(),
                });
            }
            const sectionMap = tabMap.get(tabKey)!.sectionsByType;
            if (!sectionMap.has(sectionType)) sectionMap.set(sectionType, []);
            sectionMap.get(sectionType)!.push(market);
            continue;
        }

        // Normalize per-game/map winner and handicap types into a single type
        // so they merge into one section in the default (Series Lines) tab
        // e.g. game_1_winner → game_winner, map_2_winner → map_winner
        type = normalizeSeriesType(type);

        // For merged map/game winner/handicap sections, override line with the map/game number
        // so the line switcher shows "1", "2", "3" instead of "0 0 0".
        // Extract from the original sportsMarketType (map_1_winner → 1) or from
        // the market's title/question text (fallback).
        let effectiveMarket = market;
        if (
            (type === 'map_winner' || type === 'game_winner' || type === 'map_handicap' || type === 'game_handicap') &&
            !market.line
        ) {
            const originalType = market.sportsMarketType?.toLowerCase() || '';
            const typeNum = originalType.match(/^(?:map|game)_(\d+)_(?:winner|handicap)$/)?.[1];
            if (typeNum) {
                effectiveMarket = { ...market, line: Number(typeNum) };
            } else {
                const gameNum = parseGameNumberFromQuestion(market);
                if (gameNum) {
                    effectiveMarket = { ...market, line: gameNum };
                }
            }
        }

        // For soccer events, first_half_totals and second_half_totals go to "halftime" tab (not "1st Half").
        // Polymarket's getTabFromSportsMarketType checks league === "soccer" for this.
        if (isSoccerEvent && (type === 'first_half_totals' || type === 'second_half_totals')) {
            const tabKey = 'halftime';
            if (!tabMap.has(tabKey)) {
                tabMap.set(tabKey, {
                    key: tabKey,
                    title: <Trans>Halftime</Trans>,
                    priority: 200,
                    sectionsByType: new Map(),
                });
            }
            const sectionMap = tabMap.get(tabKey)!.sectionsByType;
            if (!sectionMap.has(type)) sectionMap.set(type, []);
            sectionMap.get(type)!.push(effectiveMarket);
            continue;
        }

        // --- Esport fun market routing ---
        // Markets with esport prefixes (lol_*, cs2_*, etc.) need per-game tab routing.
        // The game number comes from the question text ("Game 1: ...", "Map 2: ...").
        const esportKey = detectEsportPrefix(type);
        if (esportKey) {
            const prefixLen = type.indexOf('_') + 1;
            const baseType = type.slice(prefixLen); // e.g. "both_teams_baron"
            const gameNum = parseGameNumberFromQuestion(effectiveMarket);
            const term = ESPORT_PREFIX_TERM[esportKey] || 'game';
            if (gameNum) {
                const tabKey = `${term}-${gameNum}`;
                if (!tabMap.has(tabKey)) {
                    tabMap.set(tabKey, {
                        key: tabKey,
                        title: term === 'game' ? <Trans>Game {gameNum}</Trans> : <Trans>Map {gameNum}</Trans>,
                        priority: 100 + gameNum * 10,
                        sectionsByType: new Map(),
                    });
                }
                const sectionMap = tabMap.get(tabKey)!.sectionsByType;
                if (!sectionMap.has(baseType)) sectionMap.set(baseType, []);
                sectionMap.get(baseType)!.push(effectiveMarket);
                continue;
            }
            // Fallback: no game number found → route to default tab with baseType
            if (!defaultSectionsByType.has(baseType)) defaultSectionsByType.set(baseType, []);
            defaultSectionsByType.get(baseType)!.push(effectiveMarket);
            continue;
        }

        let matched = false;
        for (const rule of TAB_RULES) {
            const match = type.match(rule.pattern);
            if (match) {
                const tabKey = rule.getKey(match);
                if (!tabMap.has(tabKey)) {
                    tabMap.set(tabKey, {
                        key: tabKey,
                        title: rule.getTitle(match),
                        priority: rule.getPriority(match),
                        sectionsByType: new Map(),
                    });
                }
                const sectionMap = tabMap.get(tabKey)!.sectionsByType;
                if (!sectionMap.has(type)) sectionMap.set(type, []);
                sectionMap.get(type)!.push(effectiveMarket);
                matched = true;
                break;
            }
        }

        if (!matched) {
            if (!defaultSectionsByType.has(type)) defaultSectionsByType.set(type, []);
            defaultSectionsByType.get(type)!.push(effectiveMarket);
        }
    }

    // Phase 2: Build resolved tabs

    const hasEsportTabs = [...tabMap.keys()].some((key) => key.startsWith('game-') || key.startsWith('map-'));
    const tabs: SportMarketResolvedTab[] = [];

    // Default tab (always first)
    if (defaultSectionsByType.size > 0) {
        tabs.push({
            key: 'game-lines',
            title: hasEsportTabs ? <Trans>Series Lines</Trans> : <Trans>Game Lines</Trans>,
            sections: buildResolvedSections(defaultSectionsByType, hasEsportTabs, homeTeam, awayTeam),
        });
    }

    // Sport-specific tabs sorted by priority
    const sortedTabs = [...tabMap.values()].sort((a, b) => a.priority - b.priority);
    for (const tabInfo of sortedTabs) {
        const sections = buildResolvedSections(tabInfo.sectionsByType, hasEsportTabs, homeTeam, awayTeam);

        // Prefix section titles with map/game number for per-map/game tabs
        // e.g. "Round Handicap" → "Map 1 Round Handicap" inside the Map 1 tab
        const mapGameMatch = tabInfo.key.match(/^(map|game)-(\d+)$/);
        if (mapGameMatch) {
            const prefix = mapGameMatch[1] === 'map' ? `Map ${mapGameMatch[2]} ` : `Game ${mapGameMatch[2]} `;
            for (const section of sections) {
                section.title = (
                    <>
                        {prefix}
                        {section.title}
                    </>
                );
            }
        }

        tabs.push({
            key: tabInfo.key,
            title: tabInfo.title,
            sections,
        });
    }

    return tabs;
}

/**
 * Convert a Map<sportsMarketType, markets[]> into resolved sections.
 * Auto-detects mergeByLine when multiple markets with different lines exist.
 * @param isEsports When true, use esports-specific titles (e.g. "Total Games" instead of "Totals").
 */
function buildResolvedSections(
    sectionsByType: Map<string, BetsMarketDataForUI[]>,
    isEsports = false,
    homeTeam?: SportTeam,
    awayTeam?: SportTeam,
): SportMarketResolvedSection[] {
    const types = sortTypesByPriority(sectionsByType);

    const sections: SportMarketResolvedSection[] = [];

    for (const type of types) {
        // Player prop types are handled separately below (one section per market)
        if (PLAYER_PROP_TYPES.has(type)) continue;

        // Soccer player prop types are handled separately below (one section per market)
        if (SOCCER_PLAYER_PROP_TYPES.has(type)) continue;

        // Team totals: split by team name, deduplicate lines per team
        if (TEAM_TOTALS_TYPES.has(type)) continue;

        // Soccer team corners: split by team name, deduplicate lines per team
        if (SOCCER_TEAM_CORNERS_TYPES.has(type)) continue;

        // Per-market types: each market rendered as its own section
        if (PER_MARKET_TYPES.has(type)) continue;

        // Tennis set types: split by set number, handled separately below
        if (TENNIS_SET_SPLIT_TYPES.has(type)) continue;

        const markets = sectionsByType.get(type);
        if (!markets || markets.length === 0) continue;

        // For game/map-prefixed types, look up the base type config for title/renderAs
        const baseType = type.replace(/^game_\d+_/, '').replace(/^map_\d+_/, '');
        const config = getSectionConfig(baseType);
        const hasConfig = config.title || config.renderAs;
        const effectiveConfig = hasConfig ? config : getSectionConfig(type);
        const renderAs = effectiveConfig.renderAs ?? inferRenderAs(type);

        // Dynamic title resolution for context-dependent types
        let title: React.ReactNode =
            effectiveConfig.title ?? markets[0]?.title ?? humanizeType(baseType !== type ? baseType : type);
        // Esports: "Totals" → "Total Games" (Polymarket uses "Total Games" for esports series)
        if (type === 'totals' && isEsports) {
            title = <Trans>Total Games</Trans>;
        }
        // Esports: "Map Handicap" → "Game Handicap" when groupItemTitle contains "game" (Dota 2)
        if (!effectiveConfig.title && type === 'map_handicap') {
            const hasGame = markets.some((m) => m.groupItemTitle?.toLowerCase().includes('game'));
            title = hasGame ? <Trans>Game Handicap</Trans> : <Trans>Map Handicap</Trans>;
        }

        // Auto-detect mergeByLine: true when multiple markets have different line values
        const uniqueLines = new Set(markets.map((m) => m.line));
        const hasMultipleLines = uniqueLines.size > 1;
        const mergeByLine = effectiveConfig.mergeByLine ?? hasMultipleLines;

        sections.push({
            sportsMarketType: type,
            title,
            markets,
            mergeByLine,
            renderAs,
        });
    }

    // Player prop types: one section per market (each market = a different player)
    // Sort by line ascending, matching Polymarket's parseLinesWithMarket behavior
    for (const type of types) {
        if (!PLAYER_PROP_TYPES.has(type)) continue;
        const markets = sectionsByType.get(type);
        if (!markets || markets.length === 0) continue;

        const sorted = [...markets].sort((a, b) => (a.line ?? 0) - (b.line ?? 0));

        for (const market of sorted) {
            sections.push({
                sportsMarketType: type,
                title: extractPlayerName(market) || market.title || humanizeType(type),
                markets: [market],
                mergeByLine: false,
                renderAs: SportMarketGroupType.Total,
            });
        }
    }

    // Soccer player prop types: group by player, merge lines per player
    // Each player with multiple thresholds (0.5, 1.5, 2.5) renders as one card with a line switcher.
    for (const type of types) {
        if (!SOCCER_PLAYER_PROP_TYPES.has(type)) continue;
        const markets = sectionsByType.get(type);
        if (!markets || markets.length === 0) continue;

        // Group by the locale-independent slug key, NOT the title — one player's titles can mix
        // languages and colon widths ("Breel Embolo: 1+ 进球" vs "布雷尔·恩博洛：3+ 进球").
        const playerGroups = new Map<string, BetsMarketDataForUI[]>();
        for (const market of markets) {
            const key = playerGroupKey(market);
            if (!playerGroups.has(key)) playerGroups.set(key, []);
            playerGroups.get(key)!.push(market);
        }

        // Create one section per player, sorted by line ascending.
        // Display name comes from the lowest-line market's title (colon-stripped).
        for (const playerMarkets of playerGroups.values()) {
            const sorted = [...playerMarkets].sort((a, b) => (a.line ?? 0) - (b.line ?? 0));
            const uniqueLines = new Set(sorted.map((m) => m.line));
            const hasMultipleLines = uniqueLines.size > 1;

            sections.push({
                sportsMarketType: type,
                title: extractPlayerName(sorted[0]) || sorted[0]?.title || humanizeType(type),
                markets: sorted,
                mergeByLine: hasMultipleLines,
                renderAs: SportMarketGroupType.Total,
            });
        }
    }

    // Per-market types: each market is its own section (e.g. each exact score, each halftime result team)
    for (const type of types) {
        if (!PER_MARKET_TYPES.has(type)) continue;
        const markets = sectionsByType.get(type);
        if (!markets || markets.length === 0) continue;

        const config = getSectionConfig(type);
        const renderAs = config.renderAs ?? SportMarketGroupType.Other;

        for (const market of markets) {
            sections.push({
                sportsMarketType: type,
                title: market.title || market.groupItemTitle || humanizeType(type),
                markets: [market],
                mergeByLine: false,
                renderAs,
            });
        }
    }

    // Team totals: group by team name, deduplicate lines per team
    for (const type of types) {
        if (!TEAM_TOTALS_TYPES.has(type)) continue;
        const markets = sectionsByType.get(type);
        if (!markets || markets.length === 0) continue;

        const config = getSectionConfig(type);
        const renderAs = config.renderAs ?? inferRenderAs(type);

        // Group markets by team name
        const teamGroups = new Map<string, BetsMarketDataForUI[]>();
        for (const market of markets) {
            const teamName = extractTeamName(market, homeTeam, awayTeam) || market.title || humanizeType(type);
            if (!teamGroups.has(teamName)) teamGroups.set(teamName, []);
            teamGroups.get(teamName)!.push(market);
        }

        // Create a section per team, deduplicating lines
        for (const [teamName, teamMarkets] of teamGroups) {
            const seen = new Set<number>();
            const deduped = teamMarkets.filter((m) => {
                const key = m.line ?? 0;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            sections.push({
                sportsMarketType: type,
                title: <Trans>{teamName} Totals</Trans>,
                markets: deduped,
                mergeByLine: true,
                renderAs,
            });
        }
    }

    // Soccer team corners: group by team name, deduplicate lines per team
    for (const type of types) {
        if (!SOCCER_TEAM_CORNERS_TYPES.has(type)) continue;
        const markets = sectionsByType.get(type);
        if (!markets || markets.length === 0) continue;

        const config = getSectionConfig(type);
        const renderAs = config.renderAs ?? inferRenderAs(type);

        // Group markets by team name
        const teamGroups = new Map<string, BetsMarketDataForUI[]>();
        for (const market of markets) {
            const teamName = extractTeamName(market, homeTeam, awayTeam) || market.title || humanizeType(type);
            if (!teamGroups.has(teamName)) teamGroups.set(teamName, []);
            teamGroups.get(teamName)!.push(market);
        }

        // Create a section per team, deduplicating lines
        for (const [teamName, teamMarkets] of teamGroups) {
            const seen = new Set<number>();
            const deduped = teamMarkets.filter((m) => {
                const key = m.line ?? 0;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            sections.push({
                sportsMarketType: type,
                title: <Trans>{teamName} Corners</Trans>,
                markets: deduped,
                mergeByLine: true,
                renderAs,
            });
        }
    }

    // Tennis set types: split by set number extracted from groupItemTitle.
    // For best-of-3, there's only one set (Set 2) per type.
    // For best-of-5, multiple sets (Set 2, 3, 4) share the same sportsMarketType
    // and must be split into separate sections with dynamic titles.
    for (const type of types) {
        if (!TENNIS_SET_SPLIT_TYPES.has(type)) continue;
        const markets = sectionsByType.get(type);
        if (!markets || markets.length === 0) continue;

        const config = getSectionConfig(type);
        const renderAs = config.renderAs ?? inferRenderAs(type);

        // Group markets by set number
        const setGroups = new Map<number, BetsMarketDataForUI[]>();
        for (const market of markets) {
            const setNum = extractSetNumber(market) ?? 0;
            if (!setGroups.has(setNum)) setGroups.set(setNum, []);
            setGroups.get(setNum)!.push(market);
        }

        for (const [setNum, setMarkets] of setGroups) {
            const uniqueLines = new Set(setMarkets.map((m) => m.line));
            const hasMultipleLines = uniqueLines.size > 1;
            const mergeByLine = config.mergeByLine ?? hasMultipleLines;

            sections.push({
                sportsMarketType: type,
                title:
                    setNum > 0 ? (
                        type === 'tennis_set_winner' ? (
                            <Trans>Set {setNum} Winner</Trans>
                        ) : (
                            <Trans>Set {setNum} Total Games</Trans>
                        )
                    ) : (
                        humanizeType(type)
                    ),
                markets: setMarkets,
                mergeByLine,
                renderAs,
            });
        }
    }

    return sections;
}

/**
 * Sort types by section priority: moneyline variants first, then spreads, then totals, rest in insertion order.
 * Matches Polymarket's ordering (moneyline → spreads → totals) for all tabs, including first-half and quarters.
 */
function sortTypesByPriority(sectionsByType: Map<string, BetsMarketDataForUI[]>): string[] {
    const ordered: string[] = [];
    const seen = new Set<string>();

    // First: known priority types (exact matches before suffix matches so e.g. moneyline sorts before child_moneyline)
    for (const suffix of SECTION_PRIORITY) {
        for (const type of sectionsByType.keys()) {
            if (!seen.has(type) && type === suffix) {
                ordered.push(type);
                seen.add(type);
            }
        }

        for (const type of sectionsByType.keys()) {
            if (!seen.has(type) && type.endsWith(`_${suffix}`)) {
                ordered.push(type);
                seen.add(type);
            }
        }
    }

    // Then: remaining types in insertion order
    for (const type of sectionsByType.keys()) {
        if (!seen.has(type)) {
            ordered.push(type);
        }
    }

    return ordered;
}
