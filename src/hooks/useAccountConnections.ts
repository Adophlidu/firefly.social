import { useQuery } from '@tanstack/react-query';

import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export function useAccountConnections() {
    return useQuery({
        queryKey: ['allConnections'],
        queryFn: () => {
            return FireflyEndpointProvider.getAllConnections();
        },
    });
}
