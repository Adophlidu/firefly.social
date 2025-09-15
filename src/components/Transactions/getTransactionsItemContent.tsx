import { getSingleNFTFeedItemContent } from '@/components/NFTs/VirtualListHelper.js';
import { PolymarketActivityItem } from '@/components/Polymarket/PolymarketActivityItem.js';
import { SwapActivityItem } from '@/components/Swap/SwapActivityItem.js';
import { Source } from '@/constants/enum.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import type { TransactionsItem } from '@/providers/types/Firefly.js';

export function getTransactionsItemContent(data: TransactionsItem, index: number, listKey: string) {
    switch (data.source) {
        case Source.Swap:
            return <SwapActivityItem activity={data.data} listKey={listKey} index={index} />;
        case Source.Polymarket:
            return <PolymarketActivityItem activity={data.data} />;
        case Source.NFTs:
            return getSingleNFTFeedItemContent(index, data.data, data.data.chain_id, {
                listKey,
            });
        default:
            safeUnreachable(data);
            return null;
    }
}
