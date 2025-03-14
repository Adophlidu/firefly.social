import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { SponsorMintOptions } from '@/providers/types/Firefly.js';

export function useSponsorMintStatus(options: SponsorMintOptions, enabled = true) {
    const account = useAccount();

    return useQuery({
        queryKey: ['sponsor-mint-status', account.address, options.chainId, options.contractAddress, options.tokenId],
        enabled,
        queryFn: async () => {
            return FireflyEndpointProvider.getSponsorMintStatus(options);
        },
    });
}
