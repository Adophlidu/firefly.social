import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import { EMPTY_LIST } from '@/constants/index.js';
import { fireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { CustomTokenType, useCustomTokenStore } from '@/store/useCustomTokenStore.js';

export function useCustomNonFungibleTokens() {
    const tokens = useCustomTokenStore((state) =>
        Object.values(state.tokens).filter((x) => x.type === CustomTokenType.ERC721),
    );
    const account = useAccount();

    const paramList = tokens.map((x) => ({ contractAddress: x.address, chainId: x.chainId }));
    return useQuery({
        queryKey: ['custom-non-fungible-tokens', account.address, paramList],
        async queryFn() {
            if (!account.address) return EMPTY_LIST;
            return fireflyEndpointProvider.getCollections(paramList);
        },
        enabled: paramList.length > 0 && !!account.address,
    });
}
