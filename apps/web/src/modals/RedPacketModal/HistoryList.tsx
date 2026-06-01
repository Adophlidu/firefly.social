import { ScrollListKey } from '@dimensiondev/enums';
import { noop } from 'lodash-es';
import { createContext, type Dispatch, type SetStateAction, useMemo, useState } from 'react';

import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { VirtualList } from '@/components/VirtualList/VirtualList.js';
import { VirtualListFooter } from '@/components/VirtualList/VirtualListFooter.js';
import { RedPacketDetailItem } from '@/modals/RedPacketModal/RedPacketDetailItem.js';
import type { RedPacketClaimedInfo, RedPacketSentInfo } from '@/providers/types/FireflyRedPacket.js';

export const HistoryActionContext = createContext<{
    actionLoading: boolean;
    setActionLoading: Dispatch<SetStateAction<boolean>>;
}>({ actionLoading: false, setActionLoading: noop });

type RpHistory = RedPacketClaimedInfo | RedPacketSentInfo;
interface HistoryListProps {
    data: RpHistory[];
    onEndReached: () => Promise<void>;
}

function getRedPacketHistoryItem(history: RpHistory) {
    return <RedPacketDetailItem history={history} key={history.redpacket_id} />;
}

export function HistoryList({ data, onEndReached }: HistoryListProps) {
    const [actionLoading, setActionLoading] = useState(false);
    const contextValue = useMemo(() => ({ actionLoading, setActionLoading }), [actionLoading, setActionLoading]);

    if (!data?.length) {
        return <NoResultsFallback className="h-[478px] justify-center" />;
    }

    return (
        <HistoryActionContext.Provider value={contextValue}>
            <VirtualList
                data={data}
                endReached={onEndReached}
                components={{
                    Footer: VirtualListFooter,
                }}
                className="no-scrollbar box-border h-full min-h-0 flex-1"
                listKey={`${ScrollListKey.RedPacketHistory}`}
                computeItemKey={(_, item) => item.redpacket_id}
                itemContent={(_, history) => getRedPacketHistoryItem(history)}
            />
        </HistoryActionContext.Provider>
    );
}
