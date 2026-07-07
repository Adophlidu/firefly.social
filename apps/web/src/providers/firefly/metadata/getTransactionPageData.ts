import { TipsNotificationType } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';
import { cache } from 'react';

import { getSwapActivityByHash } from '@/providers/firefly/endpoint/getSwapActivityByHash.js';
import { getTipsTransactionDetail } from '@/providers/firefly/endpoint/getTipsTransactionDetail.js';
import type { SwapActivity, TipsDetail } from '@/providers/types/Firefly.js';

export type TransactionPageData = { kind: 'tips'; data: TipsDetail } | { kind: 'swap'; data: SwapActivity };

export const getTransactionPageData = cache(
    async (chainId: number, hash: string): Promise<TransactionPageData | null> => {
        const tips = await runInSafeAsync(() => getTipsTransactionDetail(hash, TipsNotificationType.Tip));
        if (tips) return { kind: 'tips', data: tips };

        const swap = await runInSafeAsync(() => getSwapActivityByHash(hash, chainId, { waitForToken: false }));
        if (swap) return { kind: 'swap', data: swap };

        return null;
    },
);
