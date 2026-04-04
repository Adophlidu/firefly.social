import { memo, useCallback } from 'react';

import { useRedPacketHistory } from '@/components/RedPacket/hooks/useRedPacketHistory.js';
import { HistoryList } from '@/modals/RedPacketModal/HistoryList.js';
import { type FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';

interface EvmHistoryListProps {
    address: string;
    historyType: FireflyRedPacketAPI.ActionType;
    platform?: FireflyRedPacketAPI.SourceType;
}

export const EvmHistoryList = memo<EvmHistoryListProps>(function EvmHistoryList({ address, historyType, platform }) {
    const { data, fetchNextPage, isFetching, isFetchingNextPage, hasNextPage } = useRedPacketHistory(
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
