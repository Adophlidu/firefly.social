import { EMPTY_LIST } from '@dimensiondev/constants';
import { isValidChainIdEthereum, visibleChains } from '@dimensiondev/web3/chains';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { formatTokenFromFireflyTokenAsset } from '@/helpers/formatTokenFromFireflyTokenAsset.js';
import { useCustomFungibleTokens } from '@/hooks/useCustomFungibleTokens.js';
import { getMultiChainTokenList } from '@/providers/firefly/endpoint/getMultiChainTokenList.js';
import type { TokenAsset } from '@/providers/types/Firefly.js';
import type { Token } from '@/providers/types/Transfer.js';

function sortTokensByUsdValue(tokens: Token[]) {
    return tokens.slice().sort((a, b) => b.usdValue - a.usdValue);
}

export const useEvmTokens = (address?: string, chainIds?: number[]) => {
    // Source: the same muti-chain (OKX) endpoint the wallet home uses, so the token
    // universe never diverges between the two surfaces (FW-7873).
    const queryChains = useMemo(
        () =>
            (chainIds?.length ? chainIds : visibleChains.map((chain) => chain.id)).filter((id) =>
                isValidChainIdEthereum(id),
            ),
        [chainIds],
    );
    const { data = EMPTY_LIST, isLoading } = useQuery({
        queryKey: ['evm-tokens', address?.toLowerCase(), queryChains],
        enabled: !!address && queryChains.length > 0,
        queryFn: async () => {
            if (!address) return EMPTY_LIST;
            return getMultiChainTokenList([address], queryChains);
        },
    });
    const customTokens = useCustomFungibleTokens();

    const tokens = useMemo(() => {
        const accountTokens = (data as TokenAsset[])
            .filter((token) => !token.hide)
            .map((token) => formatTokenFromFireflyTokenAsset(token));
        const sorted = sortTokensByUsdValue(accountTokens.concat(customTokens));
        // Keep the caller's chain scope (e.g. red-packet rpSupportedChains) so custom
        // tokens on chains without a red-packet contract are excluded too.
        return chainIds?.length ? sorted.filter((token) => chainIds.includes(+token.chainId)) : sorted;
    }, [customTokens, data, chainIds]);

    return { tokens, isLoading };
};
