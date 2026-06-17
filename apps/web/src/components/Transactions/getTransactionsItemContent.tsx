import { Source } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';

import { PredictionActivityItem } from '@/components/Prediction/PredictionActivityItem.js';
import { SwapActivityItem } from '@/components/Swap/SwapActivityItem.js';
import type { TransactionsItem } from '@/providers/types/Firefly.js';

export function getTransactionsItemContent(data: TransactionsItem, index: number, listKey: string) {
    switch (data.source) {
        case Source.Swap:
            return <SwapActivityItem activity={data.data} listKey={listKey} index={index} />;
        case Source.Prediction:
            return <PredictionActivityItem activity={data.data} />;
        default:
            safeUnreachable(data);
            return null;
    }
}
