import { parseJson } from '@dimensiondev/utils';

import type { PolymarketEvent, PolymarketMarket } from '@/providers/types/Firefly.js';

export interface BetEventPageConfig {
    pageTitle?: string;
    image?: string;
    leftTitle?: string;
    rightTitle?: string;
    leftColor?: string;
    rightColor?: string;
    selectedOutcomeTitle?: string;
    /** Market-name prefix from the question (e.g. "总局数" / "Games Total"); used when the web doesn't forward one. */
    marketName?: string | null;
}

/** Format a total line without trailing zeros (2.50 → "2.5", 3 → "3", 0 → "0"). */
function formatTotalLine(line: number): string {
    return String(Number(line));
}

/** Sign + magnitude of a spread handicap per outcome index (outcome 0 takes the line's sign, 1 the opposite). */
function formatSpreadLabel(line: number, index: number): string {
    const absLine = Math.abs(line);
    const positive = index === 0 ? line >= 0 : line < 0;
    return positive ? `+${absLine}` : `-${absLine}`;
}

/** Bare market name before the colon in a question like "总局数：大小球 2.5" / "Games Total: O/U 2.5". */
function extractMarketName(question: string | undefined): string | null {
    if (!question) return null;
    const match = question.match(/^[^:：]+(?=[:：])/);
    return match ? match[0].trim() : null;
}

/** Resolve a finite line from market.line, falling back to groupItemThreshold. */
function resolveLine(market: PolymarketMarket): number | null {
    if (typeof market.line === 'number' && Number.isFinite(market.line)) return market.line;
    const threshold = Number.parseFloat(market.groupItemThreshold);
    return Number.isFinite(threshold) ? threshold : null;
}

/**
 * Append the line to Over/Under (total) outcome labels (e.g. "Over" → "Over 2.5"). Outcomes are
 * translated per locale, so detect totals by the locale-invariant sportsMarketType, not the label.
 */
function resolveOverUnderTitles(
    market: PolymarketMarket | undefined,
): { marketName: string | null; leftTitle: string; rightTitle: string } | null {
    if (!market) return null;
    const type = market.sportsMarketType?.toLowerCase() ?? '';
    if (!type.includes('total') || type.includes('odd_even')) return null;
    const outcomes = parseJson<string[]>(market.outcomes) ?? [];
    if (outcomes.length !== 2) return null;
    const left = typeof outcomes[0] === 'string' ? outcomes[0].trim() : '';
    const right = typeof outcomes[1] === 'string' ? outcomes[1].trim() : '';
    if (!left || !right) return null;
    const line = resolveLine(market);
    if (line === null) return null;
    const suffix = ` ${formatTotalLine(line)}`;
    return {
        marketName: extractMarketName(market.question),
        leftTitle: `${left}${suffix}`,
        rightTitle: `${right}${suffix}`,
    };
}

/**
 * Build team + handicap labels for spread/handicap markets (e.g. "JDG +1.5"). The market's teams[]
 * is often empty, so the team comes from the outcome label; the handicap sign is derived from `line`
 * and the outcome index.
 */
function resolveSpreadTitles(
    market: PolymarketMarket | undefined,
): { marketName: string | null; leftTitle: string; rightTitle: string } | null {
    if (!market) return null;
    const type = market.sportsMarketType?.toLowerCase() ?? '';
    if (!type.includes('spread') && !type.includes('handicap')) return null;
    const outcomes = parseJson<string[]>(market.outcomes) ?? [];
    if (outcomes.length !== 2) return null;
    const left = typeof outcomes[0] === 'string' ? outcomes[0].trim() : '';
    const right = typeof outcomes[1] === 'string' ? outcomes[1].trim() : '';
    if (!left || !right) return null;
    const line = resolveLine(market);
    if (line === null) return null;
    // Prefer the team abbreviation/alias when teams[] is populated; otherwise the outcome is the team name.
    const teamName = (i: number): string => {
        const team = market.teams?.[i];
        return team?.alias || team?.abbreviation?.toUpperCase() || team?.name || (i === 0 ? left : right);
    };
    return {
        marketName: extractMarketName(market.question),
        leftTitle: `${teamName(0)} ${formatSpreadLabel(line, 0)}`,
        rightTitle: `${teamName(1)} ${formatSpreadLabel(line, 1)}`,
    };
}

export function resolveBetEventPageConfig(event: PolymarketEvent, conditionId: string): BetEventPageConfig | null {
    const moneyLineMarket = event.markets.find((m) => m.sportsMarketType?.toLowerCase() === 'moneyline');
    const teams = event.drawTeams?.length === 2 ? event.drawTeams : moneyLineMarket?.teams;
    const homeTeam = teams?.[0];
    const awayTeam = teams?.[1];
    const currentMarket = event.markets.find((m) => m.conditionId === conditionId);
    const titles = resolveOverUnderTitles(currentMarket) ?? resolveSpreadTitles(currentMarket);
    // Market/section name: totals/spreads use the question prefix; everything else uses groupItemTitle.
    const marketName = titles?.marketName ?? currentMarket?.groupItemTitle ?? null;
    if (!homeTeam || !awayTeam) {
        if (!currentMarket) return null;
        return {
            image: currentMarket.image,
            pageTitle: currentMarket.question,
            marketName,
            ...(titles ? { leftTitle: titles.leftTitle, rightTitle: titles.rightTitle } : {}),
        };
    }

    const pageTitle = `${homeTeam.name || homeTeam.abbreviation || 'Home Team'} vs ${awayTeam.name || awayTeam.abbreviation || 'Away Team'}`;
    // Regular binary markets (non-draw events)
    const leftTeam = currentMarket?.teams?.[0];
    const rightTeam = currentMarket?.teams?.[1];

    // Three-way (draw) events: each market is binary Yes/No.
    // Use groupTypeFF to determine which team/outcome this market represents.
    if (event.isDraw) {
        const groupType = currentMarket?.groupTypeFF;
        if (groupType === 1) {
            return {
                pageTitle,
                image: event.image || undefined,
                leftColor: leftTeam?.color,
                rightColor: rightTeam?.color,
                leftTitle: 'Draw',
                rightTitle: 'No Draw',
            };
        }

        // Home (0) or away (2) market — resolve team from event-level teams
        const team = groupType === 0 ? homeTeam : groupType === 2 ? awayTeam : null;
        if (team) {
            const teamLabel = team.name || team.alias || team.abbreviation?.toUpperCase();
            return {
                pageTitle,
                image: team.logo || undefined,
                leftColor: team.color,
                rightColor: undefined,
                // Title line 2 shows team name; buttons stay Yes/No (raw outcomes)
                selectedOutcomeTitle: teamLabel,
            };
        }
    }

    // Totals/spreads have no per-team side here; use the line-bearing labels instead of team names.
    if (titles) {
        return {
            pageTitle,
            marketName,
            leftTitle: titles.leftTitle,
            rightTitle: titles.rightTitle,
        };
    }

    return {
        pageTitle,
        marketName,
        leftColor: leftTeam?.color,
        rightColor: rightTeam?.color,
        leftTitle: leftTeam?.alias || leftTeam?.abbreviation?.toUpperCase() || leftTeam?.name,
        rightTitle: rightTeam?.alias || rightTeam?.abbreviation?.toUpperCase() || rightTeam?.name,
    };
}
