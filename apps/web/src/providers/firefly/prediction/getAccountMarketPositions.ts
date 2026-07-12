import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getAccountMarketPositions(conditionIds: string[] = [], eventIds?: string[]) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/polymarket/account/position');
    // The backend's MarketPositionQuery accepts conditionIds and/or eventIds.
    // Omit empty arrays so the server reads a missing field as "no filter"
    // rather than "match zero" — iOS sends only eventIds for sport events,
    // where conditionIds fails to match (FW-7899).
    const body: { conditionIds?: string[]; eventIds?: string[] } = {};
    if (conditionIds.length) body.conditionIds = conditionIds;
    if (eventIds?.length) body.eventIds = eventIds;
    const response = await fireflySessionHolder.fetchWithSession<
        Response<
            Array<{
                proxy?: string;
                wallet?: string;
            }>
        >
    >(url, {
        method: 'POST',
        body: JSON.stringify(body),
    });
    return resolveFireflyResponseData(response);
}
