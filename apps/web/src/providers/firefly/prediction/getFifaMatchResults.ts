import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { FifaMatchResultsData, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

/**
 * FIFA World Cup match scores + penalty-shootout detail (Sportmonks-backed,
 * CDN-cached, no params). Joined to Polymarket events via `event_slug`.
 */
export async function getFifaMatchResults(): Promise<FifaMatchResultsData> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/fifa/match-results');
    const response = await fetchJson<Response<FifaMatchResultsData>>(url, {
        method: 'GET',
    });
    const data = resolveFireflyResponseData(response);

    return {
        matches: Array.isArray(data?.matches) ? data.matches : [],
        updated_at: data?.updated_at ?? null,
    };
}
