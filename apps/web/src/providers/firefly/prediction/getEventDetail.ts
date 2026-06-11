import { PredictionPlatform } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { cache } from 'react';
import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import {
    formatOpinionEvent,
    formatPolymarketEvent,
    mergeSportGroupedMarkets,
} from '@/providers/firefly/prediction/formatEvents.js';
import { getSportEventDetail } from '@/providers/firefly/prediction/getSportEventDetail.js';
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

export const getEventDetail = cache(async function getEventDetail(
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
            if (!detail) return null;
            const formatted = formatPolymarketEvent(detail);
            if (!formatted.sportData?.gameId) return formatted;

            try {
                const sportDetail = await getSportEventDetail(id);
                if (sportDetail?.groupedMarkets?.length) {
                    return mergeSportGroupedMarkets(formatted, sportDetail);
                }
            } catch {}

            return formatted;
        }
        default:
            safeUnreachable(platform);
            return null;
    }
});
