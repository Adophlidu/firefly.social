import urlcat from 'urlcat';

import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { getTopHolders } from '@/providers/prediction/polymarket/getTopHolders.js';
import type { OpinionHolder, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

interface Options {
    id: string;
    indicator: PageIndicator;
    outcome: string;
    limit?: number;
    signal?: AbortSignal;
}

export async function getPolymarketBetsTopHolders(options: Options) {
    const allHolders = await getTopHolders({
        ids: [options.id],
        limit: options.limit,
        signal: options.signal,
    });
    return allHolders;
}

export async function getOpinionBetsTopHolders(options: Options) {
    const limit = options.limit ?? 20;
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/opinion/market/holder', {
        topicId: options.id,
        type: options.outcome,
        page: options.indicator.id,
        limit,
    });
    const response = await fireflySessionHolder.fetchWithoutSession<
        Response<{
            errmsg: string;
            errno: number;
            result: {
                list: OpinionHolder[];
            };
        } | null>
    >(url, { signal: options.signal });
    const data = resolveFireflyResponseData(response);
    if (data?.errno !== 0) {
        throw new Error(data?.errmsg || 'Failed to fetch polymarket top holders');
    }

    const holders = data.result?.list || [];
    const nextIndicatorId = holders.length === limit ? Number(options.indicator.id || 0) + 1 : null;
    return createPageable(
        holders,
        createIndicator(options.indicator),
        nextIndicatorId ? createNextIndicator(options.indicator, nextIndicatorId.toString()) : undefined,
    );
}
