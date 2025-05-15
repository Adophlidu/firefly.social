import type { CoinGeckoToken } from '@/providers/types/CoinGecko.js';
import type { SearchableToken } from '@/providers/types/Firefly.js';

export function formatMarketToken(token: SearchableToken) {
    return {
        id: token.id,
        symbol: token.symbol,
        name: token.name,
        source: '',
        type: 'FungibleToken',
        logoURL: token.large,
        rank: token.market_cap_rank,
        socialLinks: {
            website: '',
            twitter: '',
            telegram: '',
        },
    } as CoinGeckoToken;
}
