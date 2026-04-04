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
import { type PolymarketPositionData, type Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getPositionHistory({
    address,
    indicator,
    isProxyAddress,
    eventId,
    limit = 20, // exactly the same as App's limit
    isClaim = false, // true: current positions; false: history positions
}: {
    address: string;
    indicator?: PageIndicator;
    isProxyAddress?: boolean;
    limit?: number;
    isClaim?: boolean;
    eventId?: string;
}): Promise<Pageable<PolymarketPositionData, PageIndicator>> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/polymarket/positions/info');
    const response = await fireflySessionHolder.fetch<
        Response<{
            data: PolymarketPositionData[];
            cursor: number | null;
        }>
    >(url, {
        method: 'POST',
        body: JSON.stringify({
            eventId,
            is_polymarketProxy: isProxyAddress,
            limit,
            cursor: indicator?.id ? +indicator.id : undefined,
            wallet: address,
            is_claim: isClaim,
            exclude_lose: false,
            exclude_win: false,
        }),
    });
    const data = resolveFireflyResponseData(response);

    return createPageable(
        data.data,
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, data.cursor.toString()) : undefined,
    );
}
