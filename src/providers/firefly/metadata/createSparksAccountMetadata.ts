import type { Metadata } from 'next';
import urlcat from 'urlcat';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { fetchMetadataApi } from '@/providers/firefly/metadata/fetchMetadataApi.js';

export async function createSparksAccountMetadata(accountId: string, pathname: string): Promise<Metadata> {
    try {
        const response = await fetchMetadataApi(
            urlcat('/metadata/sparks-account', {
                accountId,
                pathname,
            }),
        );
        return resolveResponseData(response);
    } catch (error) {
        return createSiteMetadata(pathname);
    }
}
