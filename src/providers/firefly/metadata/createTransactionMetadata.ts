import { type Metadata } from 'next';
import urlcat from 'urlcat';

import { SITE_URL } from '@/constants/static.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getSwapActivityByHash } from '@/providers/firefly/endpoint/getSwapActivityByHash.js';
import { fetchMetadataApi } from '@/providers/firefly/metadata/fetchMetadataApi.js';

export async function createTransactionMetadata(chainId: number, hash: string, pathname: string): Promise<Metadata> {
    // Check if it's a swap transaction - use custom OG metadata for swaps
    const swapData = await runInSafeAsync(() => getSwapActivityByHash(hash, chainId));

    if (swapData) {
        const title = `View ${swapData.from_token?.symbol || ''}-${swapData.to_token?.symbol || ''} swap transaction on Firefly`;
        const description = `Stay ahead of the curve with real-time on-chain activity: token swaps, trades, bets, and more.`;
        const url = urlcat(SITE_URL, pathname);
        const imageUrl = urlcat(SITE_URL, '/api/og/swap/:chainId/:hash/image', { chainId, hash });

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

    // For non-swap transactions, use the backend API
    try {
        const response = await fetchMetadataApi(
            urlcat('/metadata/transaction', {
                chainId,
                hash,
                pathname,
            }),
        );
        const metadata = resolveResponseData(response);
        return metadata;
    } catch (error) {
        return createSiteMetadata(pathname);
    }
}
