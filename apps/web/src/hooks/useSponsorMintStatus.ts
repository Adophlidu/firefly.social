import { useQuery } from '@tanstack/react-query';
import { useConnection } from 'wagmi';

import { getSponsorMintStatus } from '@/providers/firefly/wallet-transaction/getSponsorMintStatus.js';
import { type SponsorMintOptions } from '@/providers/types/Firefly.js';

export function useSponsorMintStatus(options: SponsorMintOptions) {
    const account = useConnection();

    return useQuery({
        queryKey: [
            'sponsor-mint-status',
            account.address?.toLowerCase(),
            options.chainId,
            options.contractAddress?.toLowerCase(),
            options.tokenId,
        ],
        enabled: !!options.chainId && !!options.contractAddress,
        queryFn: async () => {
            return getSponsorMintStatus(options);
        },
    });
}
