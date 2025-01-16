import { web3 } from '@coral-xyz/anchor';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { EMPTY_LIST } from '@/constants/index.js';
import { formatSolanaRedPackets } from '@/helpers/formatSolanaRedPackets.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { SolanaRedPacket } from '@/providers/solana/RedPacket.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';

export function useSolanaRedPacketHistory(
    address: string,
    historyType: FireflyRedPacketAPI.ActionType,
    platform?: FireflyRedPacketAPI.SourceType,
) {
    return useSuspenseInfiniteQuery({
        queryKey: ['redpacket-history', 'solana', address, historyType],
        initialPageParam: createIndicator(undefined, ''),
        queryFn: async ({ pageParam }) => {
            try {
                const account = new web3.PublicKey(address);
                const packets = await SolanaRedPacket.getRedPacketsByCreator(account);
                const data = await formatSolanaRedPackets(packets, address);

                return createPageable(data, createIndicator());
            } catch {
                return createPageable(EMPTY_LIST, createIndicator());
            }
        },
        getNextPageParam: (lastPage) => lastPage.nextIndicator,
        select: (data) => data.pages.flatMap((x) => x.data),
    });
}
