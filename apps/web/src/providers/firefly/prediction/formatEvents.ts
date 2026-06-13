import { BetsMarketResolveStatus, PredictionPlatform } from '@dimensiondev/enums';
import { parseJson } from '@dimensiondev/utils';
import { first, last } from 'lodash-es';

import { resolveSportData } from '@/helpers/prediction/polymarket/resolveSportData.js';
import { matchesTeamLabel } from '@/helpers/prediction/sportScoreUtils.js';
import { resolveCryptoFromPolymarketEvent } from '@/providers/firefly/prediction/resolveCryptoFromPolymarketEvent.js';
import { getPredictionRecurrenceFromPolymarketEvent } from '@/providers/prediction/polymarket/resolveCryptoUpDownFromEvent.js';
import type {
    PolymarketEvent,
    PolymarketSportDetail,
    PolymarketSportGroupedMarketItem,
} from '@/providers/prediction/polymarket/type.js';
import type { OpinionMarketDetail } from '@/providers/types/Firefly.js';
import {
    type BetsEventDataForUI,
    type BetsMarketDataForUI,
    PredictionRecurrence,
    type SportTeam,
} from '@/types/prediction.js';

function filterAndSortPolymarketMarkets(detail: PolymarketEvent) {
    const markets = (detail.markets || []).filter((market) => market.active);
    try {
        if (detail.sortBy === 'price') {
            markets.sort((a, b) => {
                const aPrices = parseJson<string[]>(a.outcomePrices);
                const bPrices = parseJson<string[]>(b.outcomePrices);
                const aPrice = first(aPrices) || '0';
                const bPrice = first(bPrices) || '0';
                return Number.parseFloat(bPrice) - Number.parseFloat(aPrice);
            });
        } else {
            markets.sort((a, b) => {
                const aThreshold = a.groupItemThreshold || '0';
                const bThreshold = b.groupItemThreshold || '0';
                return Number.parseFloat(aThreshold) - Number.parseFloat(bThreshold);
            });
        }

        return markets;
    } catch {
        return markets;
    }
}

function sortMarkets(markets: BetsMarketDataForUI[]) {
    return [
        ...markets.filter((market) => !market.isResolved && !market.isClosed),
        ...markets.filter((market) => market.isResolved || market.isClosed),
    ];
}

function fixRecurrence(recurrence: PredictionRecurrence, startTime?: string, endDate?: string) {
    if (!startTime || !endDate) return recurrence;

    if (recurrence !== PredictionRecurrence.Daily) return recurrence;

    const diff = new Date(endDate).getTime() - new Date(startTime).getTime();
    const diffHours = diff / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffDays < 1 && diffHours === 4) return PredictionRecurrence.FourHours;

    return recurrence;
}

/**
 * Generic 3-way merge for markets that come as separate binary markets (one per outcome).
 * The sport detail API returns home/draw/away as individual markets with Yes/No outcomes.
 * This merges them into a single market with 3 outcomes (Team1/Draw/Team2).
 */
function mergeThreeWayMarketsOfType(
    markets: BetsMarketDataForUI[],
    homeTeam: SportTeam,
    awayTeam: SportTeam,
    marketType: string,
): BetsMarketDataForUI[] {
    const matchedIndices: number[] = [];
    const matchedMarkets: BetsMarketDataForUI[] = [];
    const normalizedType = marketType.toLowerCase();

    markets.forEach((m, i) => {
        if (m.sportsMarketType?.toLowerCase() === normalizedType) {
            matchedIndices.push(i);
            matchedMarkets.push(m);
        }
    });

    if (matchedMarkets.length < 3) return markets;

    let homeMarket: BetsMarketDataForUI | undefined;
    let drawMarket: BetsMarketDataForUI | undefined;
    let awayMarket: BetsMarketDataForUI | undefined;

    for (const m of matchedMarkets) {
        const title = m.groupItemTitle || m.title;
        if (matchesTeamLabel(homeTeam, title)) {
            homeMarket = m;
        } else if (matchesTeamLabel(awayTeam, title)) {
            awayMarket = m;
        } else {
            // Matches neither team: the middle outcome (Draw / Neither / No Score / …).
            drawMarket = m;
        }
    }

    if (!homeMarket || !drawMarket || !awayMarket) return markets;

    // Moneyline draw titles from Gamma are messy (e.g. "Draw (Qatar vs. Switzerland)"),
    // so keep a clean "Draw" label there. Soccer grouped types carry a clean groupItemTitle
    // ("Draw", "Neither", …) — use it so the middle button shows the right label.
    const isMoneyline = normalizedType === 'moneyline';
    const drawLabel = isMoneyline ? 'Draw' : drawMarket.groupItemTitle || drawMarket.title || 'Draw';

    const combined: BetsMarketDataForUI = {
        id: homeMarket.id,
        slug: homeMarket.slug,
        conditionId: homeMarket.conditionId,
        questionId: homeMarket.questionId,
        title: homeMarket.title,
        volume: matchedMarkets.reduce((sum, m) => sum + Number.parseFloat(m.volume || '0'), 0).toString(),
        isResolved: matchedMarkets.every((m) => m.isResolved),
        isClosed: matchedMarkets.every((m) => m.isClosed),
        createTime: homeMarket.createTime,
        resolvedOutcomeId: homeMarket.resolvedOutcomeId,
        image: homeMarket.image,
        outcomes: [
            {
                id: homeMarket.outcomes[0]?.id || '',
                label: homeTeam.abbreviation?.toUpperCase() || homeTeam.name || 'Home',
                price: homeMarket.outcomes[0]?.price || '0',
                slug: homeMarket.slug,
            },
            {
                id: awayMarket.outcomes[0]?.id || '',
                label: awayTeam.abbreviation?.toUpperCase() || awayTeam.name || 'Away',
                price: awayMarket.outcomes[0]?.price || '0',
                slug: awayMarket.slug,
            },
            {
                id: drawMarket.outcomes[0]?.id || '',
                label: drawLabel,
                price: drawMarket.outcomes[0]?.price || '0',
                slug: drawMarket.slug,
            },
        ],
        statusList: homeMarket.statusList,
        bestAsk: homeMarket.bestAsk,
        bestBid: homeMarket.bestBid,
        sportsMarketType: homeMarket.sportsMarketType,
        originalMoneylineMarkets: matchedMarkets,
    };

    const result = [...markets];
    for (let i = matchedIndices.length - 1; i >= 0; i -= 1) {
        result.splice(matchedIndices[i], 1);
    }

    result.splice(matchedIndices[0], 0, combined);
    return result;
}

export function formatPolymarketEvent(detail: PolymarketEvent): BetsEventDataForUI {
    const isSameImage = detail.markets?.every((market) => market.image === detail.image);

    const sportData = resolveSportData(detail);
    let markets: BetsMarketDataForUI[] = filterAndSortPolymarketMarkets(detail).map((market) => {
        const outcomeLabels = parseJson<string[]>(market.outcomes);
        const outcomeIds = parseJson<string[]>(market.clobTokenIds);
        const prices = parseJson<string[]>(market.outcomePrices);
        const isResolved = market.umaResolutionStatus === BetsMarketResolveStatus.Resolved;
        const outcomes = (outcomeLabels || []).map((x, i) => ({
            id: outcomeIds?.[i] || '',
            label: x,
            price: prices?.[i] || '0',
        }));
        const statusList: BetsMarketResolveStatus[] = [];
        const statuses = parseJson<BetsMarketResolveStatus[]>(market.umaResolutionStatuses || '[]');
        if (statuses && Array.isArray(statuses)) {
            statusList.push(
                ...statuses.filter((s) =>
                    [
                        BetsMarketResolveStatus.Proposed,
                        BetsMarketResolveStatus.Disputed,
                        BetsMarketResolveStatus.Resolved,
                    ].includes(s),
                ),
            );
            if (isResolved) {
                if (!statusList.includes(BetsMarketResolveStatus.Disputed) && statuses.length > 0) {
                    statusList.splice(1, 0, BetsMarketResolveStatus.NoDisputed);
                }
                if (last(statusList) !== BetsMarketResolveStatus.Resolved) {
                    statusList.push(BetsMarketResolveStatus.Resolved);
                }
            }
            if (last(statusList) === BetsMarketResolveStatus.Disputed && !isResolved) {
                statusList.push(BetsMarketResolveStatus.Review);
            }
        }

        // For esports fun markets (dota2_*, lol_*, cs2_*), the Gamma API returns all games'
        // markets with the same sportsMarketType. The game number is only in the question field
        // (e.g. "Game 1: Ends in Daytime?"). Prefix the type with game_N_ for tab routing.
        const rawType = market.sportsMarketType?.toLowerCase() || '';
        let effectiveType = rawType;
        if (rawType && !rawType.startsWith('game_') && !rawType.startsWith('map_') && market.question) {
            const gameNum = market.question.match(/^(?:Game|Map)\s*(\d+)\s*:/i)?.[1];
            if (gameNum) {
                effectiveType = `game_${gameNum}_${rawType}`;
            }
        }

        return {
            id: market.id,
            slug: market.slug,
            questionId: market.id,
            volume: market.volume,
            title: market.groupItemTitle || market.question,
            question: market.question,
            isResolved,
            resolvedOutcomeId:
                isResolved && outcomes?.length === 2
                    ? Number.parseFloat(outcomes[0].price) >= Number.parseFloat(outcomes[1].price)
                        ? outcomes[0].id
                        : outcomes[1].id
                    : undefined,
            isClosed: !!market.closed,
            createTime: new Date(market.startDate || market.createdAt).getTime(),
            image: isSameImage ? undefined : market.image,
            conditionId: market.conditionId,
            outcomes,
            statusList,
            bestAsk: market.bestAsk,
            bestBid: market.bestBid,
            groupItemThreshold: market.groupItemThreshold,
            groupItemTitle: market.groupItemTitle,
            sportsMarketType: effectiveType,
            line: market.line,
            closedTime: market.closedTime
                ? new Date(market.closedTime.replace(' ', 'T').replace(/\+\d+$/, '') + 'Z').getTime()
                : undefined,
        };
    });

    if (sportData?.isDraw && sportData.homeTeam && sportData.awayTeam) {
        markets = mergeThreeWayMarketsOfType(markets, sportData.homeTeam, sportData.awayTeam, 'moneyline');
    }

    const cryptoName = resolveCryptoFromPolymarketEvent(detail);
    const eventStartTime = first(detail.markets)?.eventStartTime;

    return {
        id: detail.id,
        slug: detail.slug,
        title: detail.title,
        image: detail.image,
        status: detail.active ? 'active' : 'ended',
        platform: PredictionPlatform.Polymarket,
        description: detail.description,
        isSingleEvent: detail.markets?.length === 0,
        tags: detail.tags,
        endTime: new Date(detail.endDate).getTime(),
        volume: detail.volume,
        markets: sortMarkets(markets),
        startTime: eventStartTime || detail.startTime || detail.startDate,
        endDate: detail.endDate,
        closed: detail.closed,
        archived: detail.archived,
        cryptoData:
            cryptoName &&
            detail.series?.some((s) =>
                [
                    PredictionRecurrence.FiveMinutes,
                    PredictionRecurrence.FifteenMinutes,
                    PredictionRecurrence.FourHours,
                    PredictionRecurrence.Daily,
                    PredictionRecurrence.Hour,
                ].includes(s.recurrence),
            )
                ? {
                      name: cryptoName,
                      recurrence: getPredictionRecurrenceFromPolymarketEvent(detail) ?? undefined,
                      priceToBeat: detail.eventMetadata?.priceToBeat,
                      finalPrice: detail.eventMetadata?.finalPrice,
                  }
                : undefined,
        series: detail.series
            ?.filter((s) => s.active)
            ?.map((s) => ({
                id: s.id,
                slug: s.slug,
                originalRecurrence: s.recurrence,
                recurrence: fixRecurrence(s.recurrence, detail.startTime, detail.endDate),
            })),
        sportData,
    };
}

function formatSportGroupedMarketItem(
    item: PolymarketSportGroupedMarketItem,
    sportsMarketType?: string,
): BetsMarketDataForUI {
    // These fields may be JSON strings at runtime despite being typed as string[]
    const rawOutcomeLabels = Array.isArray(item.outcomes) ? item.outcomes : parseJson<string[]>(item.outcomes) || [];
    const outcomeIds = Array.isArray(item.clobTokenIds)
        ? item.clobTokenIds
        : parseJson<string[]>(item.clobTokenIds) || [];
    const prices = Array.isArray(item.outcomePrices)
        ? item.outcomePrices
        : parseJson<string[]>(item.outcomePrices) || [];
    const isResolved = item.umaResolutionStatus === BetsMarketResolveStatus.Resolved;
    // Soccer player props return "Yes"/"No" from the sport detail API,
    // but should display as Over/Under to match Polymarket's UI.
    // Map to bare "Over"/"Under" — SportBuyButtons.getOutcomeMeta appends the line value.
    const isSoccerPlayerProp = sportsMarketType?.startsWith('soccer_player_');
    const outcomeLabels = isSoccerPlayerProp
        ? rawOutcomeLabels.map((label) => {
              if (label === 'Yes') return 'Over';
              if (label === 'No') return 'Under';
              return label;
          })
        : rawOutcomeLabels;
    const outcomes = outcomeLabels.map((label, i) => ({
        id: outcomeIds[i] || '',
        label,
        price: prices[i] || '0',
    }));

    return {
        id: item.id || '',
        slug: item.slug,
        questionId: item.id || '',
        volume: `${item.volumeClob ?? 0}`,
        title: item.groupItemTitle || '',
        isResolved,
        resolvedOutcomeId:
            isResolved && outcomes.length === 2
                ? Number.parseFloat(outcomes[0].price) >= Number.parseFloat(outcomes[1].price)
                    ? outcomes[0].id
                    : outcomes[1].id
                : undefined,
        isClosed: isResolved,
        createTime: 0,
        conditionId: item.conditionId || '',
        outcomes,
        sportsMarketType,
        line: item.line,
        groupItemTitle: item.groupItemTitle || undefined,
        groupItemThreshold:
            item.groupItemThreshold !== null && item.groupItemThreshold !== undefined
                ? `${item.groupItemThreshold}`
                : undefined,
    };
}

/**
 * Detect the actual soccer player prop stat type from groupItemTitle or slug.
 * The backend returns all player props (goals, shots, assists) under soccer_player_goals,
 * but the actual stat type can be inferred from the title or slug.
 * Returns null if the market is genuinely a goals prop (keep original type).
 */
function resolveSoccerPlayerPropType(item: PolymarketSportGroupedMarketItem): string | null {
    const title = (item.groupItemTitle || '').toLowerCase();
    const slug = (item.slug || '').toLowerCase();

    if (title.includes('shot') || slug.includes('-shots-')) return 'soccer_player_shots';
    if (title.includes('assist') || slug.includes('-assists-')) return 'soccer_player_assists';

    return null;
}

/**
 * Soccer-specific merge: the sport detail API's groupedMarkets are the authoritative
 * source. Keep only the moneyline from the Gamma-formatted event (already 3-way merged),
 * and replace all other markets with the groupedMarkets items.
 */
function mergeSoccerGroupedMarkets(event: BetsEventDataForUI, sportDetail: PolymarketSportDetail): BetsEventDataForUI {
    // Keep the already-merged 3-way moneyline from Gamma
    const moneylineMarkets = event.markets.filter((m) => m.sportsMarketType?.toLowerCase() === 'moneyline');

    // Flatten all non-moneyline grouped markets, using each group's sportsMarketType
    let groupedMarkets: BetsMarketDataForUI[] = [];
    for (const group of sportDetail.groupedMarkets || []) {
        const rawType = group.sportsMarketType;
        if (!rawType) continue;
        const marketType = rawType.toLowerCase();
        if (marketType === 'moneyline') continue;

        for (const item of group.markets || []) {
            let effectiveType = marketType;
            if (marketType === 'soccer_player_goals') {
                const detectedType = resolveSoccerPlayerPropType(item);
                if (detectedType) effectiveType = detectedType;
            }
            groupedMarkets.push(formatSportGroupedMarketItem(item, effectiveType));
        }
    }

    // Merge 3-way markets (halftime/2nd-half results come as separate binary markets)
    const homeTeam = event.sportData?.homeTeam;
    const awayTeam = event.sportData?.awayTeam;
    if (homeTeam && awayTeam) {
        for (const type of ['soccer_halftime_result', 'soccer_second_half_result', 'soccer_first_to_score']) {
            groupedMarkets = mergeThreeWayMarketsOfType(groupedMarkets, homeTeam, awayTeam, type);
        }
    }

    return {
        ...event,
        markets: sortMarkets([...moneylineMarkets, ...groupedMarkets]),
    };
}

export function mergeSportGroupedMarkets(
    event: BetsEventDataForUI,
    sportDetail: PolymarketSportDetail,
): BetsEventDataForUI {
    // Soccer: sport detail API returns different IDs than Gamma API,
    // so the esports merge logic would duplicate markets. Use soccer-specific path.
    const isSoccerEvent = (sportDetail.groupedMarkets || []).some((g) =>
        g.sportsMarketType?.toLowerCase().startsWith('soccer_'),
    );
    if (isSoccerEvent) {
        return mergeSoccerGroupedMarkets(event, sportDetail);
    }

    // Build slug -> game number from eventSlugs (index 0 = series, 1+ = games)
    const slugToGameNumber = new Map<string, number>();
    if (sportDetail.eventSlugs) {
        for (let i = 1; i < sportDetail.eventSlugs.length; i += 1) {
            slugToGameNumber.set(sportDetail.eventSlugs[i], i);
        }
    }

    // Series-level types that should NOT be game-prefixed
    // These appear in the default "Series Lines" / "Game Lines" tab
    const SERIES_TYPES = new Set([
        // Standard series types
        'total_games',
        'total_maps',
        'total_sets',
        'game_winner',
        'game_handicap',
        'map_winner',
        'map_handicap',
        'totals',
        'spreads',
        // Per-game winner displayed as a single section with line switcher in Series Lines tab
        'child_moneyline',
        // Esports series-level handicap types (_match = series aggregate)
        'round_handicap_match',
        'kill_handicap_match',
        'tower_handicap_match',
        'drake_handicap_match',
        'nashor_handicap_match',
        'inhibitor_handicap_match',
        'barrack_handicap_match',
        // Esports series-level totals
        'round_over_under_match',
        // Esports series-level "most" types
        'kill_most_2_way_match',
        'tower_most_2_way_match',
        'drake_most_2_way_match',
        'nashor_most_2_way_match',
        'inhibitor_most_2_way_match',
        'barrack_most_2_way_match',
        // Per-game CS2 types that appear in Series Lines tab (already contain game number)
        'round_handicap_game_1',
        'round_handicap_game_2',
        'round_handicap_game_3',
        'round_over_under_game_1',
        'round_over_under_game_2',
        'round_over_under_game_3',
        // Tennis set-specific types (should not get game_ prefix)
        'tennis_set_winner',
        'tennis_set_games_totals',
        // Soccer market types (sub-category slugs represent market categories, not games)
        'soccer_exact_score',
        'soccer_halftime_result',
        'both_teams_to_score',
        'both_teams_to_score_first_half',
        'soccer_team_totals',
        'soccer_first_half_team_totals',
        'first_half_totals',
        // Soccer-prefixed variants (future-proofing)
        'soccer_moneyline',
        'soccer_spreads',
        'soccer_totals',
        'soccer_both_teams_to_score',
    ]);

    // Helper: compute game-prefixed type for a market item
    function getGamePrefixedType(type: string, eventSlug?: string): string {
        if (SERIES_TYPES.has(type) || /^game_\d+_/.test(type) || /^map_\d+_/.test(type)) {
            return type;
        }
        const gameNumber = eventSlug ? slugToGameNumber.get(eventSlug) : undefined;
        return gameNumber ? `game_${gameNumber}_${type}` : type;
    }

    // Phase 1: Build a map of market ID -> game-prefixed type from sport detail data.
    // This is needed because existing event markets (from Gamma API) don't have game context.
    const idToGameType = new Map<string, string>();
    // Also track line overrides: child_moneyline markets need game number as line for the switcher.
    const idToGameLine = new Map<string, number>();

    // Helper: resolve game-prefixed type, falling back to groupItemTitle when eventSlug is missing.
    function resolveGameType(type: string, item: PolymarketSportGroupedMarketItem): string {
        // Series-level types keep their original type (no game prefix)
        if (SERIES_TYPES.has(type)) return type;
        // Try eventSlug first (the primary mechanism)
        const prefixed = getGamePrefixedType(type, item.eventSlug);
        if (prefixed !== type) return prefixed;
        // Fallback: extract game number from groupItemTitle (e.g. "Game 1 Ends in Daytime" → 1)
        // This handles cases where the sport detail API omits eventSlug on items.
        if (item.groupItemTitle) {
            const gameNum = item.groupItemTitle.match(/(?:Game|Map)[ #]?(\d+)/i)?.[1];
            if (gameNum) return `game_${gameNum}_${type}`;
        }
        return type;
    }

    for (const group of sportDetail.groupedMarkets || []) {
        const rawType = group.sportsMarketType;
        if (!rawType || rawType.toLowerCase() === 'moneyline') continue;
        const marketType = rawType.toLowerCase();

        for (const item of group.markets || []) {
            if (!item.id) continue;
            const prefixed = resolveGameType(marketType, item);
            if (prefixed !== marketType) {
                idToGameType.set(item.id, prefixed);
            }
            // For child_moneyline, extract game number from groupItemTitle (e.g. "Game 1" → 1)
            // so the line switcher shows "1", "2" instead of "0".
            if (marketType === 'child_moneyline' && item.groupItemTitle) {
                const gameNum = item.groupItemTitle.match(/(?:Game|Map)[ #]?(\d+)/i)?.[1];
                if (gameNum) {
                    idToGameLine.set(item.id, Number(gameNum));
                }
            }
        }
    }

    // Phase 2: Update existing markets with game-prefixed types and line overrides
    let hasUpdates = false;
    const updatedMarkets = event.markets.map((m) => {
        const gameType = m.id ? idToGameType.get(m.id) : undefined;
        const gameLine = m.id ? idToGameLine.get(m.id) : undefined;
        if (gameType || gameLine !== undefined) {
            hasUpdates = true;
            return {
                ...m,
                ...(gameType ? { sportsMarketType: gameType } : {}),
                ...(gameLine !== undefined ? { line: gameLine } : {}),
            };
        }
        return m;
    });

    // Phase 3: Add new markets from sport detail that don't exist in the event yet
    const existingIds = new Set(event.markets.map((m) => m.id));
    const additionalMarkets: BetsMarketDataForUI[] = [];

    for (const group of sportDetail.groupedMarkets || []) {
        const rawType = group.sportsMarketType;
        if (!rawType || rawType.toLowerCase() === 'moneyline') continue;
        const marketType = rawType.toLowerCase();

        for (const item of group.markets || []) {
            if (!item.id || existingIds.has(item.id)) continue;

            const effectiveType = resolveGameType(marketType, item);
            additionalMarkets.push(formatSportGroupedMarketItem(item, effectiveType));
            existingIds.add(item.id);
        }
    }

    if (!hasUpdates && !additionalMarkets.length) return event;

    return {
        ...event,
        markets: sortMarkets([...updatedMarkets, ...additionalMarkets]),
    };
}

function formatOpinionMarket(market: OpinionMarketDetail): BetsMarketDataForUI {
    const isResolved = market.status === 4;

    return {
        id: `${market.topicId}`,
        questionId: market.questionId,
        conditionId: market.conditionId,
        title: market.title,
        image: market.thumbnailUrl,
        volume: market.volume,
        isResolved,
        isClosed: false,
        resolvedOutcomeId:
            isResolved && market.resultPos
                ? market.resultPos === market.yesPos
                    ? 'yes'
                    : market.resultPos === market.noPos
                      ? 'no'
                      : undefined
                : undefined,
        createTime: market.createTime * 1000,
        outcomes: [
            { id: 'yes', label: market.yesLabel || 'YES', price: market.yesMarketPrice || '0' },
            { id: 'no', label: market.noLabel || 'NO', price: market.noMarketPrice || '0' },
        ],
    };
}

export function formatOpinionEvent(detail: OpinionMarketDetail): BetsEventDataForUI {
    const markets = (detail.childList || []).map(formatOpinionMarket);

    return {
        id: detail.questionId,
        title: detail.title,
        image: detail.thumbnailUrl,
        status: 'active',
        description: detail.rules,
        platform: PredictionPlatform.Opinion,
        endTime: detail.cutoffTime * 1000,
        volume: detail.volume,
        isSingleEvent: markets.length === 0,
        markets: markets.length ? sortMarkets(markets) : [formatOpinionMarket(detail)],
    };
}
