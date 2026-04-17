import type { Metadata } from 'next';
import urlcat from 'urlcat';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { fetchMetadataApi } from '@/providers/firefly/metadata/fetchMetadataApi.js';

export async function createNftCollectionMetadata(
    chainIdOrCollectionId: string,
    addressOrTokenId: string,
    pathname: string,
): Promise<Metadata> {
    try {
        const response = await fetchMetadataApi(
            urlcat('/metadata-v2/nft-collection', {
                chainIdOrCollectionId,
                addressOrTokenId,
                pathname,
            }),
        );
        const metadata = resolveResponseData(response);
        return metadata;
    } catch (error) {
        return createSiteMetadata(pathname);
    }
}
