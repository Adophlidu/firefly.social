import type { TokenWithMarket } from '@/providers/firefly/worker/searchTokens.js';
import type { CoinGeckoGainsLoserInfo } from '@/providers/types/CoinGecko.js';

export function formatGainsOrLoser(info: CoinGeckoGainsLoserInfo): TokenWithMarket {
    return {
        api_symbol: info.symbol,
        id: info.id,
        name: info.name,
        largeLogo: info.image,
        market_cap_rank: info.market_cap_rank,
        symbol: info.symbol,
        thumbnail: info.image,
        market: {
            current_price: info.usd,
            price_change_percentage_24h: info.usd_24h_change,
        },
    };
}
