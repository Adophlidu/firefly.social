import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getAccountMarketPositions(conditionIds: string[]) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/polymarket/account/position');
    const response = await fireflySessionHolder.fetchWithSession<
        Response<
            Array<{
                proxy?: string;
                wallet?: string;
            }>
        >
    >(url, {
        method: 'POST',
        body: JSON.stringify({
            conditionIds,
        }),
    });
    return resolveFireflyResponseData(response);
}
