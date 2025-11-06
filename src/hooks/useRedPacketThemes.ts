import { useQuery } from '@tanstack/react-query';

import { getThemes } from '@/providers/firefly/red-packet/getThemes.js';

export function useRedPacketThemes() {
    return useQuery({
        queryKey: ['red-packet', 'themes'],
        queryFn: async () => getThemes(),
    });
}
