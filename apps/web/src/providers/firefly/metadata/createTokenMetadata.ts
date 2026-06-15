import { metadataWorker } from '@dimensiondev/workers-client';
import type { Metadata } from 'next';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { settings } from '@/settings/index.js';

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
        const res = await metadataWorker['metadata-v2'].token.$get(
            {
                query: {
                    keyword,
                    pathname,
                    chainId: options?.chainId !== undefined ? String(options.chainId) : undefined,
                    address: options?.address,
                    isCoinId: options?.isCoinId !== undefined ? String(options.isCoinId) : undefined,
                },
            },
            { headers: { 'X-DEVELOPMENT-API': settings.dev ? 'true' : 'false' } },
        );
        if (!res.ok) return createSiteMetadata(pathname);
        const json = await res.json();
        return resolveResponseData(json);
    } catch (error) {
        return createSiteMetadata(pathname);
    }
}
