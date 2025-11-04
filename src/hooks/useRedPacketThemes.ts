import { useQuery } from '@tanstack/react-query';

import { fireflyRedPacketProvider } from '@/providers/firefly/RedPacket.js';

export function useRedPacketThemes() {
    return useQuery({
        queryKey: ['red-packet', 'themes'],
        queryFn: async () => fireflyRedPacketProvider.getThemes(),
    });
}
