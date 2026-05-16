import { createPageTitleOG } from '@dimensiondev/workers-shared/helpers/createPageTitleOG.js';
import { createSiteMetadata } from '@dimensiondev/workers-shared/helpers/createSiteMetadata.js';
import type { Context } from 'hono';

import { getNftDetail } from '@/metadata/src/nft/getNftDetail.js';
import { resolveNFTUrl } from '@/metadata/src/nft/resolveNFTUrl.js';

export async function createMetadataNft(
    chainId: number,
    address: string,
    tokenId: string,
    pathname: string,
    c: Context,
) {
    const data = await getNftDetail(chainId, address, tokenId, c).catch(() => null);
    if (!data) return createSiteMetadata(pathname);

    const name = data.name || `${data.collection.name} #${tokenId}`;
    const title = createPageTitleOG(name);
    const description = data.description;
    const images = data.nftscan_uri || data.image_uri || data.content_uri!;
    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            title,
            description,
            images,
            url: resolveNFTUrl(chainId, address),
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images,
        },
    });
}
