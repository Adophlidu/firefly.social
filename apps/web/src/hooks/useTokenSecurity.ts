import { skipToken, useQuery } from '@tanstack/react-query';

import { getTokenSecurity } from '@/batches/getTokenSecurity.js';

export function useTokenSecurity(chainId: number | undefined, address: string | undefined) {
    return useQuery({
        queryKey: ['token-security', chainId, address?.toLowerCase()],
        queryFn: chainId && address ? () => getTokenSecurity(chainId, address) : skipToken,
    });
}
