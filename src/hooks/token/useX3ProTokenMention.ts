import { useQuery } from '@tanstack/react-query';

import { getTokenMention } from '@/providers/x3pro/getTokenMention.js';

export function useX3ProTokenMention(address: string | undefined, enabled = true) {
    return useQuery({
        enabled: enabled && !!address,
        queryKey: ['x3-pro', 'token', 'mention', address],
        queryFn: () => {
            if (!address) return null;
            return getTokenMention(address);
        },
    });
}
