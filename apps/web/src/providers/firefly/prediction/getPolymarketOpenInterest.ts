import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getPolymarketOpenInterest({ marketId, eventId }: { marketId?: string; eventId?: string }) {
    if (!marketId && !eventId) {
        throw new Error('Either marketId or eventId must be provided');
    }

    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/polymarket/market/info', {
        marketId,
        eventId,
    });
    const response = await fireflySessionHolder.fetchWithoutSession<
        Response<
            Array<{
                id: string;
                amount: number;
            }>
        >
    >(url);

    return resolveFireflyResponseData(response);
}
