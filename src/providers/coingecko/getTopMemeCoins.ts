import urlcat from 'urlcat';

import { COINGECKO_ROOT_URL } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import type { TokenWithMarket } from '@/providers/firefly/worker/searchTokens.js';
import type { CoinGeckoMemeCoinTrending } from '@/providers/types/CoinGecko.js';

export async function getTopMemeCoins() {
    const response = await fetchJson<CoinGeckoMemeCoinTrending[]>(
        urlcat(COINGECKO_ROOT_URL, '/coins/markets', {
            vs_currency: 'usd',
            category: 'meme-token',
            per_page: 50,
        }),
    );

    return response.map((x) => {
        return {
            api_symbol: x.symbol,
            id: x.id,
            name: x.name,
            largeLogo: x.image,
            market_cap_rank: x.market_cap_rank,
            symbol: x.symbol,
            thumbnail: x.image,
            market: {
                current_price: x.current_price,
                price_change_percentage_24h: x.price_change_percentage_24h,
            },
        } satisfies TokenWithMarket;
    });
}
