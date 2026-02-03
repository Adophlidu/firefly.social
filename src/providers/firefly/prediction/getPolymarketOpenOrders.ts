import urlcat from 'urlcat';

import { EMPTY_LIST } from '@/constants/static.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { PolymarketOpenOrderDetail, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

/**
 * No need to paginate for this api, as 500 items will be returned for each page.
 */
export async function getPolymarketOpenOrders(indicator?: PageIndicator) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/polymarket/v1/polymarket/getOpensOrdersList', {
        cursor: indicator?.id ?? '0',
    });
    const response = await fireflySessionHolder.fetchWithSession<
        Response<{
            list: PolymarketOpenOrderDetail[];
            cursor: string | null;
        }>
    >(url, {
        method: 'POST',
    });
    const { list, cursor } = resolveFireflyResponseData(response);
    return createPageable(
        list || EMPTY_LIST,
        createIndicator(indicator),
        cursor ? createNextIndicator(indicator, cursor) : undefined,
    );
}
