import { type Metadata } from 'next';
import urlcat from 'urlcat';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { fetchMetadataApi } from '@/providers/firefly/metadata/fetchMetadataApi.js';

export async function createTransactionMetadata(chainId: number, hash: string, pathname: string): Promise<Metadata> {
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
    } catch (_error) {
        return createSiteMetadata(pathname, {
            description: `Stay ahead of the curve with real-time on-chain activity: token swaps, trades, bets, and more.`,
        });
    }
}
