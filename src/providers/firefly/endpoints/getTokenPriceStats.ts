import { sortBy } from 'lodash-es';
import urlcat from 'urlcat';

import { NATIVE_TOKEN_ADDRESS } from '@/constants/okx.js';
import { isZeroAddressEthereum } from '@/helpers/isZeroAddress.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { TokenPriceStatsOptions, TokenPriceStatsResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getTokenPriceStats(
    options: TokenPriceStatsOptions,
): Promise<NonNullable<TokenPriceStatsResponse['data']>> {
    const params = { ...options } as TokenPriceStatsOptions;
    if (params.coingecko_id) {
        params.address = undefined;
    } else if (params.address && isZeroAddressEthereum(params.address)) {
        params.address = NATIVE_TOKEN_ADDRESS;
    }
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/token/token_market_chart', {
        ...params,
        vs_currency: 'usd',
        days: options.days || 'max',
    });
    const response = await fireflySessionHolder.fetch<TokenPriceStatsResponse>(url);
    const result = resolveFireflyResponseData(response);
    if (result.prices.length === 1) {
        const record = result.prices[0];
        result.prices.unshift([record[0] - 1, record[1]]);
    }
    result.prices = sortBy(result.prices, (x) => x[0]);
    return result;
}
