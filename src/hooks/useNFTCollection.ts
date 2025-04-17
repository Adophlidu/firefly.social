import { useQuery } from '@tanstack/react-query';

import { SimpleHashProvider } from '@/providers/simplehash/index.js';
import { EthereumChainId } from '#masknet/web3-shared-evm';

export function useNFTCollection(address: string, chainId: EthereumChainId = EthereumChainId.Mainnet, enabled = true) {
    return useQuery({
        queryKey: ['nft-collection', address, chainId],
        async queryFn() {
            return SimpleHashProvider.getCollection(address, {
                chainId,
            });
        },
    });
}
