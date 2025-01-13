import type { ChainId } from '@masknet/web3-shared-evm';
import { useQuery } from '@tanstack/react-query';

import { FireflyRedPacketEndpoint } from '@/providers/firefly/RedPacketEndpoint.js';

export function useCheckSponsorableGasFee(chainId: ChainId, walletAddress?: string) {
    return useQuery({
        queryKey: ['firefly-red-packet-sponsorable-gas-fee', walletAddress, chainId],
        queryFn() {
            if (!walletAddress || !chainId) return false;
            return FireflyRedPacketEndpoint.checkGasFreeStatus(chainId, walletAddress);
        },
    });
}
