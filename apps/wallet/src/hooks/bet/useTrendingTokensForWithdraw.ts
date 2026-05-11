import { NetworkType } from '@dimensiondev/web3/enums';
import { useQuery } from '@tanstack/react-query';

import type { SwapToken } from '@/providers/swap/types.js';
import { getPolymarketWithdrawSupportedTokensQueryOptions } from '@/queries/firefly/getPolymarketWithdrawSupportedTokensQueryOptions.js';

export interface WithdrawTrendingToken extends SwapToken {
    minCheckoutUsd: number;
}

interface Options {
    enabled?: boolean;
    chainId?: number;
}

export function useTrendingTokensForWithdraw({ enabled = false, chainId }: Options) {
    return useQuery({
        ...getPolymarketWithdrawSupportedTokensQueryOptions(),
        enabled,
        staleTime: 1000 * 60 * 30,
        select: (data) => {
            const tokens: WithdrawTrendingToken[] = (data ?? []).map((t) => ({
                address: t.token_address,
                chainId: t.chain_id,
                decimals: t.token_decimals,
                name: t.token_name,
                symbol: t.token_symbol,
                logoURI: t.token_icon,
                price: 1,
                minCheckoutUsd: t.min_checkout_usd,
                networkType: NetworkType.Ethereum,
            }));

            if (!chainId || !tokens.length) return tokens;
            return tokens.filter((token) => token.chainId === chainId);
        },
    });
}
