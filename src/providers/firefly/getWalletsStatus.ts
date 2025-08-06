import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type WalletsStatusResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getWalletsStatus(addresses: string[]) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/wallet/status');
    const response = await fireflySessionHolder.fetch<WalletsStatusResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            addresses,
        }),
    });
    return resolveFireflyResponseData(response);
}
