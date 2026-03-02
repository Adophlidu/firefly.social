import { useQuery } from '@tanstack/react-query';

import { STALE_TIMES } from '@/constants/query.js';
import { isFollowingWallet } from '@/providers/firefly/endpoint/isFollowingWallet.js';

export function useIsFollowingWallet(address: string, enabled = true) {
    return useQuery({
        enabled,
        queryKey: ['follow-wallet', address.toLowerCase()],
        staleTime: STALE_TIMES.MINUTE_5,

        queryFn: async () => isFollowingWallet(address),
    });
}
