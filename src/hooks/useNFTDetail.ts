import { EthereumChainId } from '@masknet/web3-shared-evm';
import { useQuery } from '@tanstack/react-query';

import { isValidAddressSolana } from '@/helpers/isValidAddress.js';
import { SimpleHashProvider } from '@/providers/simplehash/index.js';

export function useNFTDetail(chainId: number = EthereumChainId.Mainnet, address?: string, tokenId?: string) {
    const isSolAddress = isValidAddressSolana(address);
    const enabled = isSolAddress ? true : !!address && !!tokenId;
    return useQuery({
        queryKey: ['nft-detail', address, tokenId, chainId],
        enabled,
        async queryFn() {
            if (!enabled) return;
            return SimpleHashProvider.getNFT(
                address!,
                tokenId,
                {
                    chainId,
                },
                true,
            );
        },
    });
}
