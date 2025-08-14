import { useQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';
import { useMemo } from 'react';
import type { Address } from 'viem';

import { privyVisibleChains } from '@/configs/chains.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { formatTokenFromFireflyTokenAsset } from '@/helpers/formatTokenFromFireflyTokenAsset.js';
import { minus, multipliedBy } from '@/helpers/number.js';
import { useCustomFungibleTokens } from '@/hooks/useCustomFungibleTokens.js';
import { SolanaChainId } from '@/mask_pkgs/web3-shared/solana/index.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export function useMixesTokens({ evmAddress, solanaAddress }: { evmAddress?: Address; solanaAddress?: string }) {
    const query = useQuery({
        queryKey: ['multi-chain-tokens', evmAddress, solanaAddress],
        async queryFn() {
            return FireflyEndpointProvider.getMultiChainTokenList(
                compact([evmAddress, solanaAddress]),
                privyVisibleChains.map<number>((x) => x.id).concat(SolanaChainId.Mainnet),
            );
        },
    });
    const customFungibleTokens = useCustomFungibleTokens();
    const tokens = useMemo(() => {
        if (query.isLoading) return EMPTY_LIST;
        return (query.data ?? [])
            .map((tokenAsset) => formatTokenFromFireflyTokenAsset(tokenAsset))
            .concat(customFungibleTokens)
            .sort((a, b) => minus(multipliedBy(b.price, b.amount), multipliedBy(a.price, a.amount)).toNumber());
    }, [customFungibleTokens, query.data, query.isLoading]);

    return {
        ...query,
        tokens,
    };
}
