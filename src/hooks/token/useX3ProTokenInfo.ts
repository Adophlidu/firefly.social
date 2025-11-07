import { useQuery } from '@tanstack/react-query';

import { getTokenByAddress } from '@/providers/x3pro/getTokenByAddress.js';

export function useX3ProTokenInfo(address: string | undefined, enabled = true) {
    return useQuery({
        enabled,
        queryKey: ['x3-pro', 'token', address],
        queryFn: () => {
            if (!address) return null;
            return getTokenByAddress(address);
        },
    });
}
