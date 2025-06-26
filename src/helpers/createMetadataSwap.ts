import { createPageTitleOG } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveSwapPageUrl } from '@/helpers/resolveSwapPageUrl.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export async function createMetadataSwap(pathname: string, hash: string, chainId: number) {
    const swap = await runInSafeAsync(() => FireflyEndpointProvider.getSwapActivityByHash(hash, chainId));
    if (!swap) return createSiteMetadata(pathname);

    const title = createPageTitleOG(`${swap.from_token?.symbol} - ${swap.to_token?.symbol}`);
    const description = swap.from_token?.name;
    const images = swap.from_token?.logo ? [swap.from_token.logo] : [];
    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            title,
            description,
            images,
            url: resolveSwapPageUrl(hash, chainId),
        },
        twitter: {
            card: 'summary',
            title,
            description,
            images,
        },
    });
}
