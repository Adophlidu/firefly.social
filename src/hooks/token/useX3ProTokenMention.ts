import { useQuery } from '@tanstack/react-query';

import { X3ProProvider } from '@/providers/x3pro/index.js';

export function useX3ProTokenMention(address: string | undefined, enabled = true) {
    return useQuery({
        enabled: enabled && !!address,
        queryKey: ['x3-pro', 'token', 'mention', address],
        queryFn: () => {
            if (!address) return null;
            return X3ProProvider.getTokenMention(address);
        },
    });
}
