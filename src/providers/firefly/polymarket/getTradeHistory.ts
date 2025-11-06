import urlcat from 'urlcat';

import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { PolymarketTradeData, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getTradeHistory({
    address,
    indicator,
    limit = 20,
}: {
    address: string;
    indicator?: PageIndicator;
    limit?: number;
}): Promise<Pageable<PolymarketTradeData, PageIndicator>> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/timeline/polymarket');
    const response = await fireflySessionHolder.fetch<
        Response<{
            result: PolymarketTradeData[];
            cursor: string | null;
        }>
    >(url, {
        method: 'POST',
        body: JSON.stringify({
            walletAddresses: [address],
            size: limit,
            cursor: indicator?.id,
        }),
    });
    const data = resolveFireflyResponseData(response);

    return createPageable(
        data.result,
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
    );
}
