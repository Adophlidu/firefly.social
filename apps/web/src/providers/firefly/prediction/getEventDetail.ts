import { safeUnreachable } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { PredictionPlatform } from '@/constants/enum.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { formatOpinionEvent, formatPolymarketEvent } from '@/providers/firefly/prediction/formatEvents.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { getPolymarketEvent } from '@/providers/prediction/polymarket/getEvent.js';
import type { OpinionMarketDetail, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

export async function getOpinionMarketDetail(topicId: string, isMutil: boolean) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/opinion/market/detail', {
        topicId,
        isMutil: isMutil ? 1 : 0,
    });
    const response = await fireflySessionHolder.fetchWithoutSession<
        Response<{
            errmsg: string;
            errno: number;
            result: {
                data: OpinionMarketDetail;
            };
        }>
    >(url);
    const data = resolveFireflyResponseData(response);
    if (data?.errno !== 0 || !data.result?.data) {
        throw new Error(data?.errmsg || 'Failed to fetch opinion market detail');
    }

    return data?.result?.data;
}

interface Options {
    id: string;
    isMutil: boolean;
}

export async function getEventDetail(
    platform: PredictionPlatform,
    { id, isMutil }: Options,
): Promise<BetsEventDataForUI | null> {
    switch (platform) {
        case PredictionPlatform.Opinion: {
            const detail = await getOpinionMarketDetail(id, isMutil);
            return detail ? formatOpinionEvent(detail) : null;
        }
        case PredictionPlatform.Polymarket: {
            const detail = await getPolymarketEvent({ slug: id });
            return detail ? formatPolymarketEvent(detail) : null;
        }
        default:
            safeUnreachable(platform);
            return null;
    }
}
