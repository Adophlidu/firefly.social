import { metadataWorker } from '@dimensiondev/workers-client';
import type { Metadata } from 'next';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { settings } from '@/settings/index.js';

export async function createNftMetadata(
    addressOrTokenId: string,
    chainIdOrCollectionId: string,
    tokenId: string,
    pathname: string,
): Promise<Metadata> {
    try {
        const res = await metadataWorker['metadata-v2'].nft.$get(
            { query: { chainIdOrCollectionId, addressOrTokenId, tokenId, pathname } },
            { headers: { 'X-DEVELOPMENT-API': settings.dev ? 'true' : 'false' } },
        );
        if (!res.ok) return createSiteMetadata(pathname);
        const json = await res.json();
        return resolveResponseData(json);
    } catch (error) {
        return createSiteMetadata(pathname);
    }
}
