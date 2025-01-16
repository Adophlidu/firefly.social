import { memo, useCallback } from 'react';

import { useSolanaRedPacketHistory } from '@/components/RedPacket/hooks/useSolanaRedPacketHistory.js';
import { HistoryList } from '@/modals/RedPacketModal/HistoryList.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';

interface SolanaHistoryListProps {
    address: string;
    historyType: FireflyRedPacketAPI.ActionType;
    platform?: FireflyRedPacketAPI.SourceType;
}

export const SolanaHistoryList = memo<SolanaHistoryListProps>(function EvmHistoryList({
    address,
    historyType,
    platform,
}) {
    const { data, fetchNextPage, isFetching, isFetchingNextPage, hasNextPage } = useSolanaRedPacketHistory(
        address,
        historyType,
        platform,
    );

    const onEndReached = useCallback(async () => {
        if (!hasNextPage || isFetching || isFetchingNextPage) {
            return;
        }
        await fetchNextPage();
    }, [fetchNextPage, hasNextPage, isFetching, isFetchingNextPage]);

    return <HistoryList data={data} onEndReached={onEndReached} />;
});
