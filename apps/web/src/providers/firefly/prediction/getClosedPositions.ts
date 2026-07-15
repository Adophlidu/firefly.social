import type { Locale } from '@dimensiondev/enums';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { resolvePolymarketLocale } from '@/helpers/prediction/resolvePolymarketLocale.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type {
    PolymarketPositionV2Data,
    PolymarketV2PositionSortBy,
    PolymarketV2PositionSortDirection,
    Response,
} from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

// Polymarket API does not support these sortBy values; they are handled by client-side sorting.
const CLIENT_SIDE_ONLY_SORT_BY: readonly string[] = ['TIMESTAMP', 'REALIZEDPNL'];

export async function getClosedPositions({
    address,
    indicator,
    limit = 20,
    eventId,
    sortBy,
    locale,
    sortDirection,
}: {
    address: string;
    indicator?: PageIndicator;
    limit?: number;
    eventId?: string;
    locale?: Locale;
    sortBy?: PolymarketV2PositionSortBy;
    sortDirection?: PolymarketV2PositionSortDirection;
}): Promise<Pageable<PolymarketPositionV2Data, PageIndicator>> {
    const offset = indicator?.id ? +indicator.id : 0;

    const apiSortBy = sortBy && !CLIENT_SIDE_ONLY_SORT_BY.includes(sortBy) ? sortBy : undefined;

    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/polymarket/closed/positions', {
        user: address,
        offset,
        limit,
        locale: resolvePolymarketLocale(locale),
        ...(apiSortBy ? { sortBy: apiSortBy } : {}),
        sortDirection: sortDirection ?? 'DESC',
        ...(eventId ? { eventId } : {}),
    });

    const response = await fireflySessionHolder.fetch<Response<PolymarketPositionV2Data[]>>(url, {
        method: 'GET',
    });
    const positions = resolveFireflyResponseData(response);

    const hasNextPage = positions.length >= limit;
    return createPageable(
        positions,
        createIndicator(indicator, String(offset)),
        hasNextPage ? createNextIndicator(indicator, String(offset + positions.length)) : undefined,
    );
}
