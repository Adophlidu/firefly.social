import { useQuery } from '@tanstack/react-query';

import { checkGasFreeStatus } from '@/providers/firefly/red-packet/checkGasFreeStatus.js';
import type { EthereumChainId } from '@/web3-shared/evm/types.js';

export function useCheckSponsorableGasFee(chainId?: EthereumChainId, walletAddress?: string, enabled = true) {
    return useQuery({
        enabled,
        queryKey: ['firefly-red-packet-sponsorable-gas-fee', walletAddress, chainId],
        queryFn() {
            if (!walletAddress || !chainId) return false;
            return checkGasFreeStatus(chainId, walletAddress);
        },
    });
}
