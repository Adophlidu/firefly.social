import { createIndicator } from '@dimensiondev/utils';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import type { Hex } from 'viem';

import { getHistory } from '@/providers/firefly/red-packet/getHistory.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';

export function useRedPacketHistory(
    address: string,
    historyType: FireflyRedPacketAPI.ActionType,
    platform = FireflyRedPacketAPI.SourceType.All,
) {
    return useSuspenseInfiniteQuery({
        queryKey: ['redpacket-history', address.toLowerCase(), historyType],
        initialPageParam: createIndicator(undefined, ''),
        queryFn: async ({ pageParam }) => {
            const res = await getHistory(
                historyType,
                address as Hex,
                platform ? platform : FireflyRedPacketAPI.SourceType.All,
                pageParam,
            );
            return res;
        },
        getNextPageParam: (lastPage) => lastPage.nextIndicator,
        select: (data) => data.pages.flatMap((x) => x.data),
    });
}
