import { mainnet } from 'viem/chains';

import type { TokenTrendingData } from '@/components/TokenTrendingListItem.js';
import { resolveCoinGeckoChainId } from '@/helpers/resolveCoinGeckoChainId.js';
import type { TrendingToken } from '@/providers/types/Firefly.js';

export function formatTrendingToken(token: TrendingToken, key?: keyof TrendingToken['volume_usd']): TokenTrendingData {
    return {
        symbol: token.token_symbol,
        logo: token.token_icon,
        chainId: token.chain_id_num ?? resolveCoinGeckoChainId(token.chain_id) ?? mainnet.id,
        address: token.token_address,
        volume: key ? token.volume_usd?.[key] : undefined,
        marketCap: token.market_cap_usd,
        price: token.token_price,
        priceChange: key ? parseFloat(token.price_change?.[key] ?? '0') : undefined,
    };
}
