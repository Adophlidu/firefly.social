import { Trans } from '@lingui/react/macro';

import type { BetsMarketDataForUI } from '@/types/prediction.js';
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
    // Soccer: Halftime Result
    {
        pattern: /^soccer_halftime_result$/i,
        getKey: () => 'halftime-result',
        getTitle: () => <Trans>Halftime Result</Trans>,
        getPriority: () => 200,
    },
    // Tennis: First Set (all tennis_1st_set_* types)
    {
        pattern: /^tennis_1st_set/i,
        getKey: () => 'first-set',
        getTitle: () => <Trans>First Set</Trans>,
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
        case 'set_handicap':
            return { title: <Trans>Set Handicap</Trans>, renderAs: SportMarketGroupType.Spread };
        case 'total_sets':
            return { title: <Trans>Total Sets</Trans>, renderAs: SportMarketGroupType.Total };
        case 'total_games':
            return { title: <Trans>Total Games</Trans>, renderAs: SportMarketGroupType.Total, mergeByLine: true };
        case 'completed_match':
            return { title: <Trans>Completed Match</Trans> };
        case 'nrfi':
            return { title: <Trans>NRFI</Trans> };
        case 'game_winner':
            return { title: <Trans>Game Winner</Trans>, renderAs: SportMarketGroupType.Spread, mergeByLine: true };
        case 'game_handicap':
            return { title: <Trans>Game Handicap</Trans>, renderAs: SportMarketGroupType.Spread };
        case 'total_maps':
            return { title: <Trans>Total Maps</Trans>, renderAs: SportMarketGroupType.Total };
        case 'map_winner':
            return { title: <Trans>Map Winner</Trans>, renderAs: SportMarketGroupType.Spread, mergeByLine: true };
        case 'map_handicap':
            return { title: <Trans>Map Handicap</Trans>, renderAs: SportMarketGroupType.Spread, mergeByLine: true };

        // Soccer-specific
        case 'soccer_exact_score':
            return { title: <Trans>Exact Score</Trans> };
        case 'soccer_halftime_result':
            return { title: <Trans>Halftime Result</Trans>, renderAs: SportMarketGroupType.Moneyline };

        // Tennis-specific
        case 'tennis_1st_set_winner':
            return { title: <Trans>Winner</Trans>, renderAs: SportMarketGroupType.Moneyline };
        case 'tennis_1st_set_total_games':
            return { title: <Trans>Total Games</Trans>, renderAs: SportMarketGroupType.Total, mergeByLine: true };

        // Basketball first-half
        case 'first_half_moneyline':
            return { title: <Trans>Moneyline</Trans>, renderAs: SportMarketGroupType.Moneyline };
        case 'first_half_spreads':
            return { title: <Trans>Spreads</Trans>, renderAs: SportMarketGroupType.Spread, mergeByLine: true };
        case 'first_half_totals':
            return { title: <Trans>Totals</Trans>, renderAs: SportMarketGroupType.Total, mergeByLine: true };

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

        default:
            return {};
    }
}

/** Infer renderAs from keywords in the type string. */
function inferRenderAs(type: string): SportMarketGroupType {
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

/** Basketball player prop types: each market is a different player → one section per market. */
const PLAYER_PROP_TYPES = new Set(['points', 'rebounds', 'assists', 'threes']);

/** Basketball market types that Polymarket ignores (not rendered). */
const IGNORED_TYPES = new Set(['basketball_team_to_score_first', 'basketball_odd_even', 'points_assists_rebounds']);

/** Extract player name from market question/title (text before the colon, e.g. "James Harden: Points O/U 27.5"). */
function extractPlayerName(market: BetsMarketDataForUI): string {
    const source = market.question || market.title || '';
    const idx = source.indexOf(':');
    return idx === -1 ? source : source.slice(0, idx).trim();
}

/** Desired section ordering — moneyline variants first, then spreads, then totals. */
const SECTION_PRIORITY = ['moneyline', 'spreads', 'totals'];

/**
 * Derive tabs directly from market data by inspecting sportsMarketType values.
 * Each market is assigned to a tab via pattern rules; unmatched markets go to
 * the default "Game Lines" (or "Series Lines" for esports) tab.
 *
 * Sections within each tab are grouped by sportsMarketType, with mergeByLine
 * auto-detected when multiple markets share a type with different line values.
 */
export function getSportMarketTabs(markets: BetsMarketDataForUI[]): SportMarketResolvedTab[] {
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

    for (const market of markets) {
        const type = market.sportsMarketType?.toLowerCase();
        if (!type) continue;

        // Skip market types that should not be rendered
        if (IGNORED_TYPES.has(type)) continue;

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
                sectionMap.get(type)!.push(market);
                matched = true;
                break;
            }
        }

        if (!matched) {
            if (!defaultSectionsByType.has(type)) defaultSectionsByType.set(type, []);
            defaultSectionsByType.get(type)!.push(market);
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
            sections: buildResolvedSections(defaultSectionsByType),
        });
    }

    // Sport-specific tabs sorted by priority
    const sortedTabs = [...tabMap.values()].sort((a, b) => a.priority - b.priority);
    for (const tabInfo of sortedTabs) {
        tabs.push({
            key: tabInfo.key,
            title: tabInfo.title,
            sections: buildResolvedSections(tabInfo.sectionsByType),
        });
    }

    return tabs;
}

/**
 * Convert a Map<sportsMarketType, markets[]> into resolved sections.
 * Auto-detects mergeByLine when multiple markets with different lines exist.
 */
function buildResolvedSections(sectionsByType: Map<string, BetsMarketDataForUI[]>): SportMarketResolvedSection[] {
    const types = sortTypesByPriority(sectionsByType);

    const sections: SportMarketResolvedSection[] = [];

    for (const type of types) {
        // Player prop types are handled separately below (one section per market)
        if (PLAYER_PROP_TYPES.has(type)) continue;

        const markets = sectionsByType.get(type);
        if (!markets || markets.length === 0) continue;

        const config = getSectionConfig(type);
        const renderAs = config.renderAs ?? inferRenderAs(type);

        // Auto-detect mergeByLine: true when multiple markets have different line values
        const uniqueLines = new Set(markets.map((m) => m.line));
        const hasMultipleLines = uniqueLines.size > 1;
        const mergeByLine = config.mergeByLine ?? hasMultipleLines;

        sections.push({
            sportsMarketType: type,
            title: config.title ?? markets[0]?.title ?? humanizeType(type),
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

    return sections;
}

/**
 * Sort types by section priority: moneyline variants first, then spreads, then totals, rest in insertion order.
 * Matches Polymarket's ordering (moneyline → spreads → totals) for all tabs, including first-half and quarters.
 */
function sortTypesByPriority(sectionsByType: Map<string, BetsMarketDataForUI[]>): string[] {
    const ordered: string[] = [];
    const seen = new Set<string>();

    // First: known priority types (exact match or suffix like first_half_moneyline, q1_spreads, etc.)
    for (const suffix of SECTION_PRIORITY) {
        for (const type of sectionsByType.keys()) {
            if (!seen.has(type) && (type === suffix || type.endsWith(`_${suffix}`))) {
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
