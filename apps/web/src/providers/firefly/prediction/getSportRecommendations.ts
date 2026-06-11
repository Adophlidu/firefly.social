import { formatPolymarketSportsEventForUI } from '@/helpers/prediction/category/formatPolymarketSportsEventForUI.js';
import { getSportsEventList } from '@/providers/firefly/prediction/getSportsEventList.js';
import type { PolymarketSportsEvent, PolymarketSportsListRequest } from '@/providers/types/Firefly.js';

const MAX_RECOMMENDATIONS = 5;
const LIVE_CATEGORY_SLUG = 'live';

interface SportRecommendationSource {
    categorySlug: string;
    categoryTagType?: string;
    request: PolymarketSportsListRequest;
}

export interface SportRecommendationsResult {
    categorySlug: string;
    categoryTagType?: string;
    events: PolymarketSportsEvent[];
}

function getRecommendationSources(leagueSlug?: string): SportRecommendationSource[] {
    const sources: SportRecommendationSource[] = [];

    if (leagueSlug) {
        sources.push({
            categorySlug: leagueSlug,
            categoryTagType: 'league',
            request: {
                children_tag_slug: leagueSlug,
                children_tag_slug_type: 'league',
            },
        });
    }

    sources.push({
        categorySlug: LIVE_CATEGORY_SLUG,
        request: {
            children_tag_slug: LIVE_CATEGORY_SLUG,
        },
    });

    return sources;
}

function getRecommendationEventKey(event: PolymarketSportsEvent) {
    return event.slug || event.id;
}

function isClosedSportsEvent(event: PolymarketSportsEvent) {
    return event.closed || event.game_status === 2 || event.game_status === '2' || event.game_status === 'finished';
}

export async function getSportRecommendations(
    leagueSlug?: string,
    excludeGameId?: number | string,
    sportTagSlugs?: string[],
): Promise<PolymarketSportsEvent[]> {
    const result = await getSportRecommendationsResult(leagueSlug, excludeGameId, sportTagSlugs);
    return result.events;
}

export async function getSportRecommendationsResult(
    leagueSlug?: string,
    excludeGameId?: number | string,
    sportTagSlugs?: string[],
): Promise<SportRecommendationsResult> {
    const sources = getRecommendationSources(leagueSlug);
    const excludeGameIdText = excludeGameId === undefined ? undefined : `${excludeGameId}`;
    const normalizedSportTags = sportTagSlugs?.map((s) => s.toLowerCase());
    const events: PolymarketSportsEvent[] = [];
    const seen = new Set<string>();
    let resultSource = sources[0];

    for (const source of sources) {
        const data = await getSportsEventList(source.request);
        const sourceEvents = [
            ...(data.live || []),
            ...(data.today || []),
            ...(data.tomorrow || []),
            ...(data.afterTomorrow || []),
            ...(data.afterThreeDays || []),
        ];

        for (const event of sourceEvents) {
            if (excludeGameIdText && `${event.gameId}` === excludeGameIdText) continue;
            if (isClosedSportsEvent(event)) continue;
            if (!formatPolymarketSportsEventForUI(event)) continue;

            // Filter live fallback events by sport category tags
            if (normalizedSportTags?.length && source.categorySlug === LIVE_CATEGORY_SLUG) {
                const eventTagSlugs = event.tags?.map((t) => t.slug?.toLowerCase()).filter(Boolean) ?? [];
                if (eventTagSlugs.length && !eventTagSlugs.some((t) => normalizedSportTags.includes(t))) continue;
            }

            const key = getRecommendationEventKey(event);
            if (seen.has(key)) continue;
            seen.add(key);
            if (!events.length) resultSource = source;
            events.push(event);

            if (events.length >= MAX_RECOMMENDATIONS) {
                return {
                    categorySlug: resultSource.categorySlug,
                    categoryTagType: resultSource.categoryTagType,
                    events,
                };
            }
        }
    }

    return {
        categorySlug: resultSource.categorySlug,
        categoryTagType: resultSource.categoryTagType,
        events,
    };
}
