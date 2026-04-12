import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { PolymarketProfileData, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getProfile(address: string, isProxyAddress?: boolean) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/polymarket/profile/info');
    const response = await fireflySessionHolder.fetch<Response<PolymarketProfileData>>(url, {
        method: 'POST',
        body: JSON.stringify({ wallet: address, is_polymarketProxy: isProxyAddress }),
    });
    return resolveFireflyResponseData(response);
}
