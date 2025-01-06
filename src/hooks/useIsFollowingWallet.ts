import { useQuery } from '@tanstack/react-query';

import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export function useIsFollowingWallet(address: string, enabled = true) {
    return useQuery({
        enabled,
        queryKey: ['follow-wallet', address.toLowerCase()],
        staleTime: 1000 * 60 * 5, // 5 minutes
        queryFn: async () => FireflyEndpointProvider.isFollowingWallet(address),
    });
}
