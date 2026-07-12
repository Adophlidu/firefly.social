import type { SportTimelineActivityCardData } from '@/components/Prediction/Sport/SportTimelineActivityCard.js';
import { getPrimaryMarket, matchesTeamLabel } from '@/helpers/prediction/sportScoreUtils.js';
import type { BetsEventDataForUI, BetsMarketDataForUI, SportTeam } from '@/types/prediction.js';

// Slug suffixes that mark the middle outcome of a 3-way market (Draw / Neither / No Score).
// Mirrors the private MIDDLE_SLUG_SUFFIXES in providers/firefly/prediction/formatEvents.ts.
const MIDDLE_SLUG_SUFFIXES = new Set(['draw', 'neither', 'noscore', 'no-score']);

/**
 * Classify a binary leg of a 3-way moneyline as home / draw / away.
 *
 * Mirrors the private `classifyThreeWayLeg` in `providers/firefly/prediction/formatEvents.ts`
 * (helpers cannot import providers). The sport-detail API localizes `groupItemTitle`, so the
 * locale-independent slug suffix is tried first, then team-label matching falls through.
 */
function classifyThreeWayLeg(
    leg: BetsMarketDataForUI,
    homeTeam: SportTeam,
    awayTeam: SportTeam,
): 'home' | 'draw' | 'away' {
    const slugSuffix = leg.slug?.toLowerCase().split('-').pop()?.trim() ?? '';
    if (slugSuffix === 'home') return 'home';
    if (slugSuffix === 'away') return 'away';
    if (MIDDLE_SLUG_SUFFIXES.has(slugSuffix)) return 'draw';
    if (matchesTeamLabel(homeTeam, slugSuffix)) return 'home';
    if (matchesTeamLabel(awayTeam, slugSuffix)) return 'away';

    const title = leg.groupItemTitle || leg.title;
    if (matchesTeamLabel(homeTeam, title)) return 'home';
    if (matchesTeamLabel(awayTeam, title)) return 'away';
    return 'draw';
}

/**
 * Convert a resolved {@link BetsEventDataForUI} sport event into the subset of `BetsActivity`
 * fields consumed by `SportTimelineActivityCard`, so the For-You Orb timeline can render the Figma sport
 * card (team columns, score/probability, LIVE/FINAL, per-team buy buttons) from event data.
 *
 * Returns `null` when the event has no sport data or no usable market — callers fall back to a
 * plain "View game" link.
 *
 * For 3-way (home/draw/away) events the moneyline is the merged market from
 * `mergeThreeWayMarketsOfType` (outcomes ordered [home, away, "Draw"]), and each binary leg in
 * `originalMoneylineMarkets` is mapped to its own `gameData.markets` entry so every team/draw
 * button deep-links to its own Polymarket market. Binary events omit `gameData` and reuse the
 * single moneyline slug.
 */
export function betsEventDataToSportTimelineActivity(event: BetsEventDataForUI): SportTimelineActivityCardData | null {
    const sportEventData = event.sportData;
    if (!sportEventData) return null;

    const moneyline = getPrimaryMarket(event.markets);
    if (!moneyline) return null;

    const conditionOutcomes = moneyline.outcomes.map((outcome) => outcome.label);
    const conditionOutcomePrices = moneyline.outcomes.map((outcome) => outcome.price);
    const slug = moneyline.slug || event.slug || '';

    const homeTeam = sportEventData.homeTeam;
    const awayTeam = sportEventData.awayTeam;
    const isDraw = sportEventData.isDraw;

    // Per-leg markets so each home/draw/away button opens its own market with the right Yes price.
    // Only the 3-way merged moneyline carries originalMoneylineMarkets (>= 3 legs).
    let gameData: SportTimelineActivityCardData['gameData'];
    const legs = moneyline.originalMoneylineMarkets;
    if (isDraw && legs && legs.length >= 3) {
        gameData = {
            markets: legs.map((leg) => {
                const side = classifyThreeWayLeg(leg, homeTeam, awayTeam);
                const groupTypeFF = side === 'home' ? 0 : side === 'draw' ? 1 : 2;
                return {
                    slug: leg.slug,
                    outcomePrices: JSON.stringify([leg.outcomes[0]?.price]),
                    groupTypeFF,
                    active: !leg.isClosed,
                    closed: leg.isClosed,
                };
            }),
        };
    }

    return {
        platform: event.platform,
        volume: event.volume,
        slug,
        conditionOutcomes,
        conditionOutcomePrices,
        sportData: {
            live: sportEventData.live,
            ended: sportEventData.ended,
            closed: event.closed ?? event.status === 'ended',
            isDraw,
            gameId: sportEventData.gameId,
            startTime: sportEventData.startTime,
            leagueName: sportEventData.leagueName,
            scoreShow: sportEventData.scores,
            scoreType: sportEventData.scoreType,
            periodShow: sportEventData.period,
            winResult: sportEventData.winResult,
            marketTeams: [homeTeam, awayTeam],
            drawTeams: isDraw ? [homeTeam, awayTeam] : undefined,
        },
        gameData,
        rawData: {
            outcomes: JSON.stringify(conditionOutcomes),
            outcomePrices: JSON.stringify(conditionOutcomePrices),
            slug,
            startDateIso: event.startDate,
            startDate: event.startDate,
        },
    };
}
