import { memo, useCallback } from 'react';

import { useRedPacketHistory } from '@/components/RedPacket/hooks/useRedPacketHistory.js';
import { HistoryList } from '@/modals/RedPacketModal/HistoryList.js';
import type { ActionType, SourceType } from '@/providers/types/FireflyRedPacket.js';

interface SolanaHistoryListProps {
    address: string;
    historyType: ActionType;
    platform?: SourceType;
}

export const SolanaHistoryList = memo<SolanaHistoryListProps>(function SolanaHistoryList({
    address,
    historyType,
    platform,
}) {
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
