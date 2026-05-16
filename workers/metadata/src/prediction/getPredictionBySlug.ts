import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@dimensiondev/workers-shared/helpers/resolveFireflyResponseData.js';
import { resolveFireflyRootUrl } from '@dimensiondev/workers-shared/helpers/resolveFireflyRootUrl.js';
import { safeUnreachable } from '@dimensiondev/workers-shared/helpers/unreachable.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { FireflyResponse } from '@dimensiondev/workers-shared/types/firefly.js';
import type { Context } from 'hono';

import { POLYMARKET_MARKET_API_DOMAIN } from '@/metadata/src/prediction/constants.js';
import { resolvePolymarketResponse } from '@/metadata/src/prediction/resolvePolymarketResponse.js';
import type { OpinionMarketDetail, PolymarketEventResponse } from '@/metadata/src/prediction/types.js';
import { PredictionPlatform } from '@/metadata/src/prediction/types.js';

async function getPolymarketEventBySlug(slug: string, c: Context) {
    const url = urlcat(POLYMARKET_MARKET_API_DOMAIN, `/events/slug/${slug}`, {
        slug,
    });
    const response = await fetchJson<PolymarketEventResponse>(url, {
        context: c,
    });
    return resolvePolymarketResponse(response);
}

async function getOpinionMarketDetail(topicId: string, isMutil: boolean, c: Context) {
    const url = urlcat(resolveFireflyRootUrl(c), '/v1/opinion/market/detail', {
        topicId,
        isMutil: isMutil ? 1 : 0,
    });
    const response = await fetchJson<
        FireflyResponse<{
            errmsg: string;
            errno: number;
            result: {
                data: OpinionMarketDetail;
            };
        }>
    >(url, {
        context: c,
    });
    const data = resolveFireflyResponseData(response);
    if (data.errno !== 0 || !data?.result?.data) {
        throw new Error(data.errmsg || 'Failed to get opinion market detail');
    }

    return data.result.data;
}

export async function getEventDetail(
    platform: PredictionPlatform,
    { id, isMutil }: { id: string; isMutil?: boolean },
    c: Context,
) {
    switch (platform) {
        case PredictionPlatform.Polymarket:
            return getPolymarketEventBySlug(id, c);
        case PredictionPlatform.Opinion:
            return getOpinionMarketDetail(id, !!isMutil, c);
        default:
            safeUnreachable(platform);
            return null;
    }
}
