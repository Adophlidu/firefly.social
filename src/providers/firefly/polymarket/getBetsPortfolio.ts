import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { BetPortfolioItem, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getBetsPortfolio(addresses: string[]) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/bets/portfolio');
    const response = await fireflySessionHolder.fetch<Response<{ result: BetPortfolioItem[] }>>(url, {
        method: 'POST',
        body: JSON.stringify({ wallet: addresses, is_proxy: false }),
    });
    return resolveFireflyResponseData(response);
}
