import { useQuery } from '@tanstack/react-query';

import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export const queryMyAllConnections = {
    queryKey: ['allConnections'],
    async queryFn() {
        return await FireflyEndpointProvider.getAllConnectionsFormatted();
    },
} as const;

export function useAllConnections(options?: { enabled?: boolean }) {
    const isLogin = useIsLoginFirefly();
    return useQuery({ ...queryMyAllConnections, enabled: isLogin ?? options?.enabled });
}
