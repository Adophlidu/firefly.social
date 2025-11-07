import { useQuery } from '@tanstack/react-query';

import { getSupportedChains } from '@/providers/okx/getSupportedChains.js';

export function useOkxSupportedChains() {
    return useQuery({
        queryKey: ['okx-swap', 'supported-chains'],
        queryFn: async () => {
            const chains = await getSupportedChains();
            // use ethereum chains only
            return chains?.filter((x) => x.dexTokenApproveAddress);
        },
    });
}
