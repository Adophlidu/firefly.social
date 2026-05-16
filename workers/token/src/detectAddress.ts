import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@dimensiondev/workers-shared/helpers/resolveFireflyResponseData.js';
import { resolveFireflyRootUrl } from '@dimensiondev/workers-shared/helpers/resolveFireflyRootUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { Context } from 'hono';

import type { DetectAddressResponse } from '@/token/src/types.js';

export async function detectAddress(address: string, chainId: string | undefined, c: Context) {
    if (!address) return null;

    const url = urlcat(resolveFireflyRootUrl(c), '/v2/wallet/detect', {
        address,
        chainId,
    });
    const response = await fetchJson<DetectAddressResponse>(url, { context: c });
    return resolveFireflyResponseData(response);
}
