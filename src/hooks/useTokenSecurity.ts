import { skipToken, useQuery } from '@tanstack/react-query';

import { getTokenSecurity } from '@/providers/goplus/getTokenSecurity.js';

export function useTokenSecurity(chainId: number | undefined, address: string | undefined) {
    return useQuery({
        queryKey: ['token-security', chainId, address],
        queryFn: chainId && address ? () => getTokenSecurity(chainId, address) : skipToken,
    });
}
