import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { OpinionPriceHistory, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

interface OpinionOptions {
    period: string;
    start_time: number;
    end_time: number;
    size: number;
    question_ids: string[];
    signal?: AbortSignal;
}

export async function getOpinionMarketPriceHistory({ question_ids, signal, ...rest }: OpinionOptions) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/opinion/market/kline_batch', {
        ...rest,
        question_ids: question_ids.join(','),
    });
    const response = await fireflySessionHolder.fetchWithoutSession<
        Response<{
            errmsg: string;
            errno: number;
            result: {
                period: string;
                questions: OpinionPriceHistory[];
                ts: number;
            };
        }>
    >(url, { signal });
    const data = resolveFireflyResponseData(response);
    if (data.errno !== 0 || !data.result) {
        throw new Error(data.errmsg || 'Failed to fetch opinion market price history');
    }

    return data.result.questions;
}
