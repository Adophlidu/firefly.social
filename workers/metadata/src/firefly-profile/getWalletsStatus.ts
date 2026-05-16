import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@dimensiondev/workers-shared/helpers/resolveFireflyResponseData.js';
import { resolveFireflyRootUrl } from '@dimensiondev/workers-shared/helpers/resolveFireflyRootUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { Context } from 'hono';

import type { WalletsStatusResponse } from '@/metadata/src/firefly-profile/types.js';

export async function getWalletsStatus(addresses: string[], c: Context) {
    const url = urlcat(resolveFireflyRootUrl(c), '/v2/wallet/status');
    const response = await fetchJson<WalletsStatusResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            addresses,
        }),
        context: c,
    });
    return resolveFireflyResponseData(response);
}
