import { createPageTitleOG } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveCollectionChain } from '@/helpers/resolveCollectionChain.js';
import { resolveNFTUrl } from '@/helpers/resolveNFTUrl.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { EVM } from '@/providers/nft-scan/types.js';

export async function createMetadataNFT(pathname: string, chainId: number, address: string, tokenId: string) {
    const data = await FireflyEndpointProvider.getNFTDetail(chainId, address, tokenId).catch(() => null);
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

function createCollectionMetadata(pathname: string, data: EVM.Collection) {
    const title = createPageTitleOG(data.name);
    const description = data.description;
    const images = [data.large_image_url || data.banner_url || data.featured_url || data.logo_url];
    const { chainId, address } = resolveCollectionChain(data);
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

export async function createMetadataNFTCollection(pathname: string, chainId: number, address: string) {
    const data = await runInSafeAsync(() => FireflyEndpointProvider.getCollection(chainId, address));
    if (!data) return createSiteMetadata(pathname);

    return createCollectionMetadata(pathname, data);
}
