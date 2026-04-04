import { safeUnreachable } from '@dimensiondev/utils';

import { getSingleNFTFeedItemContent } from '@/components/NFTs/VirtualListHelper.js';
import { PredictionActivityItem } from '@/components/Prediction/PredictionActivityItem.js';
import { SwapActivityItem } from '@/components/Swap/SwapActivityItem.js';
import { Source } from '@/constants/enum.js';
import { type TransactionsItem } from '@/providers/types/Firefly.js';

export function getTransactionsItemContent(data: TransactionsItem, index: number, listKey: string) {
    switch (data.source) {
        case Source.Swap:
            return <SwapActivityItem activity={data.data} listKey={listKey} index={index} />;
        case Source.Prediction:
            return <PredictionActivityItem activity={data.data} />;
        case Source.NFTs:
            return getSingleNFTFeedItemContent(index, data.data, data.data.chain_id, {
                listKey,
            });
        default:
            safeUnreachable(data);
            return null;
    }
}
