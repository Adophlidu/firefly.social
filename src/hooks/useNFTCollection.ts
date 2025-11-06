import { useQuery } from '@tanstack/react-query';

import { getCollection } from '@/providers/firefly/nft/getCollection.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

export function useNFTCollection(address: string, chainId: EthereumChainId = EthereumChainId.Mainnet, enabled = true) {
    return useQuery({
        enabled,
        queryKey: ['nft-collection', chainId, address],
        async queryFn() {
            return getCollection(chainId, address);
        },
    });
}
