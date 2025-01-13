import { useQuery } from '@tanstack/react-query';

import { FireflyRedPacketEndpoint } from '@/providers/firefly/RedPacketEndpoint.js';

export function useRedPacketThemes() {
    return useQuery({
        queryKey: ['red-packet', 'themes'],
        queryFn: async () => FireflyRedPacketEndpoint.getThemes(),
    });
}
