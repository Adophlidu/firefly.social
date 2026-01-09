import { safeUnreachable } from '@dimensiondev/utils';

import { BetsActivityItem } from '@/components/Bets/BetsActivityItem.js';
import { getSingleNFTFeedItemContent } from '@/components/NFTs/VirtualListHelper.js';
import { SwapActivityItem } from '@/components/Swap/SwapActivityItem.js';
import { Source } from '@/constants/enum.js';
import { type TransactionsItem } from '@/providers/types/Firefly.js';

export function getTransactionsItemContent(data: TransactionsItem, index: number, listKey: string) {
    switch (data.source) {
        case Source.Swap:
            return <SwapActivityItem activity={data.data} listKey={listKey} index={index} />;
        case Source.Bets:
            return <BetsActivityItem activity={data.data} />;
        case Source.NFTs:
            return getSingleNFTFeedItemContent(index, data.data, data.data.chain_id, {
                listKey,
            });
        default:
            safeUnreachable(data);
            return null;
    }
}
