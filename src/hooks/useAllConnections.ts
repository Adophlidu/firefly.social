import { useQuery } from '@tanstack/react-query';

import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export const queryMyAllConnections = {
    queryKey: ['allConnections'],
    async queryFn() {
        return await FireflyEndpointProvider.getAllConnectionsFormatted();
    },
} as const;

export function useAllConnections(options?: { enabled?: boolean }) {
    return useQuery({ ...queryMyAllConnections, enabled: options?.enabled });
}
