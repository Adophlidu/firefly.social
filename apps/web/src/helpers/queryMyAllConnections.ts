import { getAllConnectionsFormatted } from '@/providers/firefly/endpoint/getAllConnectionsFormatted.js';

export const queryMyAllConnections = {
    queryKey: ['allConnections'],
    queryFn() {
        return getAllConnectionsFormatted();
    },
} as const;
