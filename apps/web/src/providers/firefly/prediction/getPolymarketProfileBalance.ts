import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { PolymarketProfileBalance, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getPolymarketProfileBalance(address: string, proxy?: boolean) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/polymarket/wallet/balance', {
        address,
        proxy,
    });
    const response = await fireflySessionHolder.fetchWithoutSession<Response<PolymarketProfileBalance>>(url);
    return resolveFireflyResponseData(response);
}
