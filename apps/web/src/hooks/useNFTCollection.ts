import { useQuery } from '@tanstack/react-query';
import { mainnet } from 'viem/chains';

import { getCollection } from '@/providers/firefly/nft/getCollection.js';

export function useNFTCollection(address: string, chainId: number | undefined = mainnet.id, enabled = true) {
    return useQuery({
        enabled,
        queryKey: ['nft-collection', chainId, address.toLowerCase()],
        async queryFn() {
            return getCollection(chainId ?? mainnet.id, address);
        },
    });
}
