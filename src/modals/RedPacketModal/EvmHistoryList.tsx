import { memo, useCallback } from 'react';

import { useEvmRedPacketHistory } from '@/components/RedPacket/hooks/useEvmRedPacketHistory.js';
import { HistoryList } from '@/modals/RedPacketModal/HistoryList.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';

interface EvmHistoryListProps {
    address: string;
    historyType: FireflyRedPacketAPI.ActionType;
    platform?: FireflyRedPacketAPI.SourceType;
}

export const EvmHistoryList = memo<EvmHistoryListProps>(function EvmHistoryList({ address, historyType, platform }) {
    const { data, fetchNextPage, isFetching, isFetchingNextPage, hasNextPage } = useEvmRedPacketHistory(
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
