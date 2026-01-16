import urlcat from 'urlcat';

import { type BetsPlatform } from '@/constants/enum.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type BetPortfolioItem, type Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getPredictionPortfolio(
    addresses: string[],
    options?: {
        isProxyAddress?: boolean;
        platform: BetsPlatform;
    },
) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/bets/portfolio');
    const response = await fireflySessionHolder.fetch<Response<{ result: BetPortfolioItem[] }>>(url, {
        method: 'POST',
        body: JSON.stringify({
            wallet: addresses,
            is_proxy: options?.isProxyAddress ?? false,
            platform: options?.platform,
        }),
    });
    return resolveFireflyResponseData(response);
}
