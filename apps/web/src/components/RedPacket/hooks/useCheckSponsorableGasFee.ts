import { useQuery } from '@tanstack/react-query';

import { checkGasFreeStatus } from '@/providers/firefly/red-packet/checkGasFreeStatus.js';

export function useCheckSponsorableGasFee(chainId?: number, walletAddress?: string, enabled = true) {
    return useQuery({
        enabled,
        queryKey: ['firefly-red-packet-sponsorable-gas-fee', walletAddress?.toLowerCase(), chainId],
        queryFn() {
            if (!walletAddress || !chainId) return false;
            return checkGasFreeStatus(chainId, walletAddress);
        },
    });
}
