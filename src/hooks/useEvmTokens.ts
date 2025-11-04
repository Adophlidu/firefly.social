import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { chains } from '@/configs/chains.js';
import { NetworkType } from '@/constants/enum.js';
import { formatBalance } from '@/helpers/formatBalance.js';
import { isGreaterThan, multipliedBy } from '@/helpers/number.js';
import { useCustomFungibleTokens } from '@/hooks/useCustomFungibleTokens.js';
import { getTokensByAddress } from '@/providers/firefly/endpoints/getTokensByAddress.js';
import type { Token } from '@/providers/types/Transfer.js';

function sortTokensByUsdValue(tokens: Token[]) {
    return tokens.sort((a, b) => b.usdValue - a.usdValue);
}

export const useEvmTokens = (address?: string) => {
    const { data, isLoading } = useQuery({
        queryKey: ['tokens', address],
        enabled: !!address,
        queryFn: async () => {
            if (!address) return [];
            return await getTokensByAddress(address);
        },
    });
    const customTokens = useCustomFungibleTokens();

    const tokens = useMemo(() => {
        return sortTokensByUsdValue(
            (data || [])
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
    }, [customTokens, data]);

    return { tokens, isLoading };
};
