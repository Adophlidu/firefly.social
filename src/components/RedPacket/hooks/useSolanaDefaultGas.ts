import { useQuery } from '@tanstack/react-query';

import type { CreateRedPacketContext } from '@/providers/ethereum/RedPacket.js';

export function useSolanaDefaultGas(context: CreateRedPacketContext, enabled = true) {
    return useQuery({
        enabled,
        queryKey: ['red-packet', 'create-gas', context.chainId, context.creator, JSON.stringify(context), enabled],
        queryFn: () => {
            return;
        },
    });
}
