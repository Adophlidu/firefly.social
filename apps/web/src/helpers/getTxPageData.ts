import { TipsNotificationType } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';
import type { Metadata } from 'next';
import { cache } from 'react';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import {
    createSwapTransactionMetadata,
    createTipsTransactionMetadata,
} from '@/helpers/createTransactionMetadataFromData.js';
import { isValidTxId } from '@/helpers/isValidTxId.js';
import { getSwapActivityByHash } from '@/providers/firefly/endpoint/getSwapActivityByHash.js';
import { getTipsTransactionDetail } from '@/providers/firefly/endpoint/getTipsTransactionDetail.js';
import type { SwapActivity, TipsDetail } from '@/providers/types/Firefly.js';

export type TxPageData = { kind: 'tips'; data: TipsDetail } | { kind: 'swap'; data: SwapActivity };

export const getTxPageData = cache(async (chainId: number, hash: string): Promise<TxPageData | null> => {
    const tips = await runInSafeAsync(() => getTipsTransactionDetail(hash, TipsNotificationType.Tip));
    if (tips) return { kind: 'tips', data: tips };

    const swap = await runInSafeAsync(() => getSwapActivityByHash(hash, chainId, { waitForToken: false }));
    if (swap) return { kind: 'swap', data: swap };

    return null;
});

export async function getTxPageMetadata(chainId: number, hash: string, pathname: string): Promise<Metadata> {
    if (!isValidTxId(hash)) {
        return createSiteMetadata(pathname, {
            description: `Stay ahead of the curve with real-time on-chain activity: token swaps, trades, bets, and more.`,
        });
    }

    const pageData = await getTxPageData(chainId, hash);
    if (pageData?.kind === 'tips') {
        return createTipsTransactionMetadata(pathname, hash, chainId, pageData.data);
    }
    if (pageData?.kind === 'swap') {
        return createSwapTransactionMetadata(pathname, hash, chainId, pageData.data);
    }

    return createSiteMetadata(pathname, {
        description: `Stay ahead of the curve with real-time on-chain activity: token swaps, trades, bets, and more.`,
    });
}
