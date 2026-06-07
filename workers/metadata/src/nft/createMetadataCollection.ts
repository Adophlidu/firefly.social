import { createPageTitleOG } from '@dimensiondev/workers-shared/helpers/createPageTitleOG.js';
import type { Context } from 'hono';

import { createSiteMetadata } from '@/metadata/src/helpers/createSiteMetadata.js';
import { getCollection } from '@/metadata/src/nft/getCollection.js';
import { resolveCollectionChain } from '@/metadata/src/nft/resolveCollectionChain.js';
import { resolveNFTUrl } from '@/metadata/src/nft/resolveNFTUrl.js';

export async function createMetadataCollection(chainId: number, address: string, pathname: string, c: Context) {
    const data = await getCollection(chainId, address, c).catch(() => null);
    if (!data) return createSiteMetadata(pathname);

    const title = createPageTitleOG(data.name);
    const description = data.description;
    const images = [data.large_image_url || data.banner_url || data.featured_url || data.logo_url];
    const resolved = resolveCollectionChain(data);
    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            title,
            description,
            images,
            url: resolveNFTUrl(resolved.chainId, resolved.address),
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images,
        },
    });
}
