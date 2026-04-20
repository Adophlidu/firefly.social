import { ZERO } from '@dimensiondev/web3/numbers';
import { useQuery } from '@tanstack/react-query';

import type { CreateRedPacketContext } from '@/providers/ethereum/red-packet/types.js';

export function useSolanaDefaultGas(context: CreateRedPacketContext, enabled = true) {
    return useQuery({
        enabled,
        queryKey: ['red-packet', 'create-gas', context.chainId, context.creator, enabled],
        queryFn: () => {
            return ZERO;
        },
    });
}
