import urlcat from 'urlcat';

import { COINGECKO_ROOT_URL } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import type { TokenWithMarket } from '@/providers/firefly/worker/searchTokens.js';
import type { CoinGeckoCoinTrending } from '@/providers/types/CoinGecko.js';

export async function getTopTrendingCoins() {
    const response = await fetchJson<{ coins: Array<{ item: CoinGeckoCoinTrending }> }>(
        urlcat(COINGECKO_ROOT_URL, '/search/trending'),
    );

    return response.coins.map(({ item: info }) => {
        return {
            api_symbol: info.symbol,
            id: info.id,
            name: info.name,
            largeLogo: info.large,
            market_cap_rank: info.market_cap_rank,
            symbol: info.symbol,
            thumbnail: info.thumb,
            market: {
                market_cap: +info.data.market_cap.replace(/(^\$|,)/g, ''),
                current_price: info.data.price,
                price_change_percentage_24h: info.data.price_change_percentage_24h.usd,
            },
        } satisfies TokenWithMarket;
    });
}
