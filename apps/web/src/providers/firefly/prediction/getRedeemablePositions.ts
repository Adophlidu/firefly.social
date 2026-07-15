import type { Locale } from '@dimensiondev/enums';
import urlcat from 'urlcat';

import { resolvePolymarketLocale } from '@/helpers/prediction/resolvePolymarketLocale.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { PolymarketPositionV2Data, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getRedeemablePositions({
    address,
    eventId,
    locale,
}: {
    address: string;
    eventId?: string;
    locale?: Locale;
}): Promise<PolymarketPositionV2Data[]> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/polymarket/current/positions', {
        user: address,
        redeemable: true,
        limit: 200,
        offset: 0,
        sortBy: 'CURRENT',
        sortDirection: 'DESC',
        locale: resolvePolymarketLocale(locale),
        ...(eventId ? { eventId } : {}),
    });

    const response = await fireflySessionHolder.fetch<Response<PolymarketPositionV2Data[]>>(url);
    return resolveFireflyResponseData(response);
}
