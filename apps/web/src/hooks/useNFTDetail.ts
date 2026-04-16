import { isValidAddressEthereum } from '@dimensiondev/web3/utils';
import { useQuery } from '@tanstack/react-query';
import { mainnet } from 'viem/chains';

import { getNFTDetail } from '@/providers/firefly/nft/getNFTDetail.js';

export function useNFTDetail(chainId: number = mainnet.id, address: string | undefined, tokenId: string | undefined) {
    const isEvmAddress = isValidAddressEthereum(address);
    const enabled = isEvmAddress && !!address && !!tokenId;
    return useQuery({
        enabled,
        queryKey: ['nft-detail', address?.toLowerCase(), tokenId, chainId],
        async queryFn() {
            if (!enabled) return;
            return getNFTDetail(chainId, address!, tokenId!);
        },
    });
}
