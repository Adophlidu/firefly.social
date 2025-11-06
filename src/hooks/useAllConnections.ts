import { useQuery } from '@tanstack/react-query';

import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { getAllConnectionsFormatted } from '@/providers/firefly/endpoint/getAllConnectionsFormatted.js';

export const queryMyAllConnections = {
    queryKey: ['allConnections'],
    async queryFn() {
        return await getAllConnectionsFormatted();
    },
} as const;

export function useAllConnections(options?: { enabled?: boolean }) {
    const isLogin = useIsLoginFirefly();
    return useQuery({ ...queryMyAllConnections, enabled: isLogin ?? options?.enabled });
}
