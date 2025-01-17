import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import { SimpleHashProvider } from '@/providers/simplehash/index.js';
import { CustomTokenType, useCustomTokenStore } from '@/store/useCustomTokenStore.js';

export function useCustomNonFungibleTokens() {
    const tokens = useCustomTokenStore((state) =>
        Object.values(state.tokens).filter((x) => x.type === CustomTokenType.ERC721),
    );
    const account = useAccount();

    const simpleHashCollectionIds = tokens.map((x) => x.simpleHashCollectionId);
    return useQuery({
        queryKey: ['custom-non-fungible-tokens', simpleHashCollectionIds, account?.address],
        async queryFn() {
            return SimpleHashProvider.getCollectionByIds(simpleHashCollectionIds);
        },
        enabled: simpleHashCollectionIds.length > 0,
    });
}
