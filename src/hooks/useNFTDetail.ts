import { useQuery } from '@tanstack/react-query';

import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { fireflyNftProvider } from '@/providers/firefly/Nft.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

export function useNFTDetail(
    chainId: number = EthereumChainId.Mainnet,
    address: string | undefined,
    tokenId: string | undefined,
) {
    const isEvmAddress = isValidAddressEthereum(address);
    const enabled = isEvmAddress && !!address && !!tokenId;
    return useQuery({
        enabled,
        queryKey: ['nft-detail', address, tokenId, chainId],
        async queryFn() {
            if (!enabled) return;
            return fireflyNftProvider.getNFTDetail(chainId, address!, tokenId!);
        },
    });
}
