import { EMPTY_LIST } from '@dimensiondev/constants';
import { NetworkType } from '@dimensiondev/enums';
import { chains } from '@dimensiondev/web3/chains';
import { isGreaterThan, multipliedBy } from '@dimensiondev/web3/numbers';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { formatBalance } from '@/helpers/formatBalance.js';
import { useCustomFungibleTokens } from '@/hooks/useCustomFungibleTokens.js';
import { getTokensByAddress } from '@/providers/firefly/endpoint/getTokensByAddress.js';
import type { Token } from '@/providers/types/Transfer.js';

function sortTokensByUsdValue(tokens: Token[]) {
    return tokens.slice().sort((a, b) => b.usdValue - a.usdValue);
}

export const useEvmTokens = (address?: string, chainIds?: number[]) => {
    const { data = EMPTY_LIST, isLoading } = useQuery({
        queryKey: ['tokens', address?.toLowerCase()],
        enabled: !!address,
        queryFn: async () => {
            if (!address) return EMPTY_LIST;
            return getTokensByAddress(address);
        },
    });
    const customTokens = useCustomFungibleTokens();

    const tokens = useMemo(() => {
        const sortedTokens = sortTokensByUsdValue(
            data
                .reduce<Token[]>((acc, token) => {
                    if (!token.chainId || !chains.some((chain) => chain.id === token.chainId)) return acc;
                    return [
                        ...acc,
                        {
                            ...token,
                            networkType: NetworkType.Ethereum,
                            chainId: token.chainId,
                            balance: formatBalance(token.raw_amount, token.decimals, {
                                isFixed: true,
                                fixedDecimals: 8,
                            }),
                            usdValue: +multipliedBy(token.price, token.amount).toFixed(2),
                        },
                    ];
                }, [])
                .filter((token) => isGreaterThan(token.usdValue, 0))
                .concat(customTokens),
        );
        return chainIds?.length ? sortedTokens.filter((token) => chainIds.includes(+token.chainId)) : sortedTokens;
    }, [customTokens, data, chainIds]);

    return { tokens, isLoading };
};
