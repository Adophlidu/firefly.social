import { memoize } from 'lodash-es';

import type { CoinGeckoToken } from '@/providers/types/CoinGecko.js';
import type { SearchableToken } from '@/providers/types/Firefly.js';

const formatMarketToken = memoize(function formatMarketToken(token: SearchableToken) {
    return {
        id: token.id,
        chainId: token.chainId,
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        source: '',
        type: 'FungibleToken',
        logoURL: token.largeLogo,
        rank: token.market_cap_rank,
        socialLinks: {
            website: '',
            twitter: '',
            telegram: '',
        },
    } as CoinGeckoToken;
});
