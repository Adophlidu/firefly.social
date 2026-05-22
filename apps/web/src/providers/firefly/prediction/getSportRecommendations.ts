import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { PolymarketSportsEvent, PolymarketSportsListResponse, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getSportRecommendations(
    leagueSlug: string,
    excludeGameId?: number | string,
): Promise<PolymarketSportsEvent[]> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/polymarket/sports/list');
    const response = await fetchJson<Response<PolymarketSportsListResponse>>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            children_tag_slug: leagueSlug,
            children_tag_slug_type: 'league',
        }),
    });
    const data = resolveFireflyResponseData(response);

    if (!data) return [];

    const events = [
        ...(data.live || []),
        ...(data.today || []),
        ...(data.tomorrow || []),
        ...(data.afterTomorrow || []),
    ];
    const excludeGameIdText = excludeGameId === undefined ? undefined : `${excludeGameId}`;
    const seen = new Set<string>();

    return events
        .filter((event) => {
            if (excludeGameIdText && `${event.gameId}` === excludeGameIdText) return false;
            if (
                event.closed ||
                event.game_status === 2 ||
                event.game_status === '2' ||
                event.game_status === 'finished'
            ) {
                return false;
            }

            const key = event.slug || event.id;
            if (seen.has(key)) return false;
            seen.add(key);

            return true;
        })
        .slice(0, 5);
}
