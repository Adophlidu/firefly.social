import { useQuery } from '@tanstack/react-query';

import { X3ProProvider } from '@/providers/x3pro/index.js';

export function useX3ProTokenInfo(address: string | undefined, enabled = true) {
    return useQuery({
        enabled,
        queryKey: ['x3-pro', 'token', address],
        queryFn: () => {
            if (!address) return null;
            return X3ProProvider.getTokenByAddress(address);
        },
    });
}
