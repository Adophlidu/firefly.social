import urlcat from 'urlcat';
import type { Address } from 'viem';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

const INVALID_POLYMARKET_ACCOUNT_CODE = 2600;

export interface PolymarketAccount {
    address: Address;
    proxyAddress: Address;
}

export async function getPolymarketAccount() {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/polymarket/v1/polymarket/getAccount');
    const response = await fireflySessionHolder.fetchWithSession<Response<PolymarketAccount>>(url, undefined, {
        noStrictOK: true,
    });

    if (response.code === INVALID_POLYMARKET_ACCOUNT_CODE) return null;

    return resolveFireflyResponseData(response);
}
