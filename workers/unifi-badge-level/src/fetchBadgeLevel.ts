import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@dimensiondev/workers-shared/helpers/resolveFireflyResponseData.js';
import { resolveFireflyRootUrl } from '@dimensiondev/workers-shared/helpers/resolveFireflyRootUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { FireflyResponse } from '@dimensiondev/workers-shared/types/firefly.js';
import type { Context } from 'hono';

import type { BadgeLevelQuery, BadgeLevelResult } from '@/unifi-badge-level/src/types.js';

interface BackendRecord {
    address: string;
    token_symbol: string;
    token_amount: string;
}

type BackendResponse = FireflyResponse<{
    level: number;
    platform: string;
    profile_id: string;
    records?: BackendRecord[];
}>;

export async function fetchBadgeLevel(query: BadgeLevelQuery, c: Context): Promise<BadgeLevelResult> {
    const url = urlcat(resolveFireflyRootUrl(c), '/v1/unifi/badge-level', {
        platform: query.platform,
        id: query.id,
    });
    const response = await fetchJson<BackendResponse>(url, { context: c });
    const data = resolveFireflyResponseData(response);
    const firstRecord = data.records?.[0];
    return {
        level: data.level,
        platform: data.platform,
        profile_id: data.profile_id,
        token_symbol: firstRecord?.token_symbol,
        token_amount: firstRecord?.token_amount,
    };
}
