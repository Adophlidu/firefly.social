import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { VirtualList } from '@/components/VirtualList/VirtualList.js';
import { VirtualListFooter } from '@/components/VirtualList/VirtualListFooter.js';
import { ScrollListKey } from '@/constants/enum.js';
import { RedPacketDetailItem } from '@/modals/RedPacketModal/RedPacketDetailItem.js';
import { type FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';

type RpHistory = FireflyRedPacketAPI.RedPacketClaimedInfo | FireflyRedPacketAPI.RedPacketSentInfo;
interface HistoryListProps {
    data: RpHistory[];
    onEndReached: () => Promise<void>;
}

function getRedPacketHistoryItem(history: RpHistory) {
    return <RedPacketDetailItem history={history} key={history.redpacket_id} />;
}

export function HistoryList({ data, onEndReached }: HistoryListProps) {
    return data?.length ? (
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
    ) : (
        <NoResultsFallback className="h-[478px] justify-center" />
    );
}
