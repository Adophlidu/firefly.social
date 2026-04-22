import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { PolymarketPositionV2Data, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getCurrentPositions({
    address,
    indicator,
    limit = 20,
    eventId,
}: {
    address: string;
    indicator?: PageIndicator;
    limit?: number;
    eventId?: string;
}): Promise<Pageable<PolymarketPositionV2Data, PageIndicator>> {
    const offset = indicator?.id ? +indicator.id : 0;

    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/polymarket/current/positions', {
        user: address,
        redeemable: true,
        offset,
        limit,
        ...(eventId ? { eventId } : {}),
    });

    const response = await fireflySessionHolder.fetch<Response<PolymarketPositionV2Data[]>>(url);
    const positions = resolveFireflyResponseData(response);

    const hasNextPage = positions.length >= limit;
    return createPageable(
        positions,
        createIndicator(indicator, String(offset)),
        hasNextPage ? createNextIndicator(indicator, String(offset + positions.length)) : undefined,
    );
}
