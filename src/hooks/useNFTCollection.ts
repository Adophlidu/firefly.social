import { useQuery } from '@tanstack/react-query';

import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { EthereumChainId } from '#masknet/web3-shared-evm';

export function useNFTCollection(address: string, chainId: EthereumChainId = EthereumChainId.Mainnet, enabled = true) {
    return useQuery({
        enabled,
        queryKey: ['nft-collection', chainId, address],
        async queryFn() {
            return FireflyEndpointProvider.getCollection(chainId, address);
        },
    });
}
