import { useQueries, useQuery } from '@tanstack/react-query';

import { NetworkPluginID } from '@/constants/enum.js';
import { formatMarketToken } from '@/helpers/formatMarketToken.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { CoinGeckoToken } from '@/providers/types/CoinGecko.js';
import { getTokenFromCoinGecko } from '@/services/getTokenFromCoinGecko.js';
import { searchTokens } from '@/services/searchTokens.js';

export interface GetTokenInfoOptions {
    symbolOrId: string;
    ensureId?: boolean;
    enabled?: boolean;
}

async function getTokenInfo({ symbolOrId, ensureId = true }: GetTokenInfoOptions) {
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
}

export function useTokenInfo(symbolOrId: string, ensureId = true, enabled = true) {
    return useQuery({
        enabled,
        queryKey: ['token', symbolOrId, ensureId],
        queryFn: () => getTokenInfo({ symbolOrId, ensureId }),
    });
}

export function useTokensInfo(options: GetTokenInfoOptions[]) {
    return useQueries({
        queries: options.map((x) => ({
            enabled: x.enabled,
            queryKey: ['token', x.symbolOrId, x.ensureId],
            queryFn: () => getTokenInfo(x),
        })),
    });
}
