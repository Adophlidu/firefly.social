import { metadataWorker } from '@dimensiondev/workers-client';
import type { Metadata } from 'next';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { settings } from '@/settings/index.js';

export async function createTransactionMetadata(chainId: number, hash: string, pathname: string): Promise<Metadata> {
    try {
        const res = await metadataWorker['metadata-v2'].transaction.$get(
            { query: { chainId: String(chainId), hash, pathname } },
            { headers: { 'X-DEVELOPMENT-API': settings.dev ? 'true' : 'false' } },
        );
        if (!res.ok)
            return createSiteMetadata(pathname, {
                description: `Stay ahead of the curve with real-time on-chain activity: token swaps, trades, bets, and more.`,
            });
        const json = await res.json();
        return resolveResponseData(json);
    } catch (_error) {
        return createSiteMetadata(pathname, {
            description: `Stay ahead of the curve with real-time on-chain activity: token swaps, trades, bets, and more.`,
        });
    }
}
