import { createSiteMetadata } from '@dimensiondev/workers-shared/helpers/createSiteMetadata.js';
import { resolveSiteUrl } from '@dimensiondev/workers-shared/helpers/resolveSiteUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { Context } from 'hono';

import type { SwapActivity } from '@/metadata/src/transaction/types.js';

export function generateSwapMetadata(pathname: string, hash: string, chainId: number, swap: SwapActivity, c: Context) {
    const title = `View ${swap.from_token?.symbol || ''}-${swap.to_token?.symbol || ''} swap transaction on Firefly`;
    const description = `Stay ahead of the curve with real-time on-chain activity: token swaps, trades, bets, and more.`;

    const images = [
        {
            url: urlcat(resolveSiteUrl(c), `/api/og/swap/${chainId}/${hash}/image`),
        },
    ];
    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            title,
            description,
            images,
            url: urlcat(resolveSiteUrl(c), `/tx/${chainId}/${hash}`),
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images,
        },
    });
}
