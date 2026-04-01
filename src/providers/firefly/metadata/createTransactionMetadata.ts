import { type Metadata } from 'next';
import urlcat from 'urlcat';

import { TipsNotificationType } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/static.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getSwapActivityByHash } from '@/providers/firefly/endpoint/getSwapActivityByHash.js';
import { getTipsTransactionDetail } from '@/providers/firefly/endpoint/getTipsTransactionDetail.js';

export async function createTransactionMetadata(chainId: number, hash: string, pathname: string): Promise<Metadata> {
    let title = 'View transaction on Firefly';
    let imageUrl = urlcat(SITE_URL, '/api/og/swap/:chainId/:hash/image', { chainId, hash });
    const tipsData = await runInSafeAsync(() => getTipsTransactionDetail(hash, TipsNotificationType.Tip));

    if (tipsData) {
        title = `View tip transaction on Firefly`;
        imageUrl = urlcat(SITE_URL, '/api/og/tip/:hash/image', { hash });
    }

    // Check if it's a swap transaction - use custom OG metadata for swaps
    const swapData = await runInSafeAsync(() => getSwapActivityByHash(hash, chainId));
    if (swapData) {
        title = `View ${swapData.from_token?.symbol || ''}-${swapData.to_token?.symbol || ''} swap transaction on Firefly`;
        imageUrl = urlcat(SITE_URL, '/api/og/swap/:chainId/:hash/image', { chainId, hash });
    }

    const description = `Stay ahead of the curve with real-time on-chain activity: token swaps, trades, bets, and more.`;
    const url = urlcat(SITE_URL, pathname);

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'article',
            url,
            images: [imageUrl],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl],
        },
    };
}
