import urlcat from 'urlcat';

import { TrendingType } from '@/constants/enum.js';
import { COINGECKO_ROOT_URL } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { formatGainsOrLoser } from '@/providers/coingecko/formatGainsOrLoser.js';
import type { TokenWithMarket } from '@/providers/firefly/worker/searchTokens.js';
import type { CoinGeckoGainsLoserInfo } from '@/providers/types/CoinGecko.js';

export async function getTopGainersOrLosers(
    type: TrendingType.TopGainers | TrendingType.TopLosers,
): Promise<TokenWithMarket[]> {
    const response = await fetchJson<{
        top_gainers: CoinGeckoGainsLoserInfo[];
        top_losers: CoinGeckoGainsLoserInfo[];
    }>(urlcat(COINGECKO_ROOT_URL, '/coins/top_gainers_losers', { vs_currency: 'usd' }));

    const data = type === TrendingType.TopGainers ? response.top_gainers : response.top_losers;
    return data.map(formatGainsOrLoser);
}
