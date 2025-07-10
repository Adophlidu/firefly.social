import urlcat from 'urlcat';

import { SITE_URL } from '@/constants/index.js';
import { createPageTitleOG } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveTxPageUrl } from '@/helpers/resolveTxPageUrl.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export async function createMetadataSwap(pathname: string, hash: string, chainId: number) {
    const swap = await runInSafeAsync(() => FireflyEndpointProvider.getSwapActivityByHash(hash, chainId));
    if (!swap) return createSiteMetadata(pathname);

    const title = createPageTitleOG(`${swap.from_token?.symbol} - ${swap.to_token?.symbol}`);
    const description = swap.from_token?.name;
    const images = [
        {
            url: urlcat(SITE_URL, 'api/og/swap/:chainId/:hash/image', {
                chainId,
                hash,
            }),
        },
    ];
    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            title,
            description,
            images,
            url: urlcat(SITE_URL, resolveTxPageUrl(hash, chainId)),
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images,
        },
    });
}
