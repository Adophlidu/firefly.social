import { type Metadata } from 'next';
import urlcat from 'urlcat';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { fetchMetadataApi } from '@/providers/firefly/metadata/fetchMetadataApi.js';

export async function createTokenMetadata(
    keyword: string,
    pathname: string,
    options?: {
        chainId?: number;
        address?: string;
        isCoinId?: boolean;
    },
): Promise<Metadata> {
    try {
        const response = await fetchMetadataApi(
            urlcat('/metadata/token', {
                keyword,
                pathname,
                ...options,
            }),
        );
        const metadata = resolveResponseData(response);
        return metadata;
    } catch (error) {
        return createSiteMetadata(pathname);
    }
}
