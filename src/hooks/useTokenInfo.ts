import { useQuery } from '@tanstack/react-query';

import { NetworkPluginID } from '@/constants/enum.js';
import { formatMarketToken } from '@/helpers/formatMarketToken.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { CoinGeckoToken } from '@/providers/types/CoinGecko.js';
import { getTokenFromCoinGecko } from '@/services/getTokenFromCoinGecko.js';
import { searchTokens } from '@/services/searchTokens.js';

export function useTokenInfo(symbolOrId: string, ensureId = true) {
    return useQuery({
        queryKey: ['token', symbolOrId, ensureId],
        queryFn: async () => {
            if (ensureId) {
                const token = await FireflyEndpointProvider.getTokenByCoinId(symbolOrId);
                if (token)
                    return {
                        pluginID: NetworkPluginID.PLUGIN_EVM,
                        id: token.id,
                        symbol: token.symbol,
                        name: token.name,
                        source: '',
                        type: 'FungibleToken',
                        logoURL: token.image.large || token.image.small || token.image.thumb,
                        socialLinks: {
                            website: '',
                            twitter: '',
                            telegram: '',
                        },
                    } as CoinGeckoToken;
            }

            const tokens = await searchTokens(symbolOrId);
            if (tokens.data[0]) return formatMarketToken(tokens.data[0]);

            return getTokenFromCoinGecko(symbolOrId);
        },
    });
}
