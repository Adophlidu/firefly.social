import { runInSafeAsync } from '@dimensiondev/utils';

import type { Metadata } from '@/compat/nextMetadata.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { createTokenMetadata } from '@/providers/firefly/metadata/createTokenMetadata.js';
import { createTokenMetadataFromToken } from '@/providers/firefly/metadata/createTokenMetadataFromToken.js';
import { getTokenDetailPageData } from '@/providers/firefly/metadata/getTokenDetailPageData.js';

export async function getTokenDetailPageMetadata(
    token_symbol: string | undefined,
    coingecko_id: string | undefined,
    chain_id: number | undefined,
    address: string | undefined,
    pathname: string,
    fallbackKeyword: string,
    fallbackOptions?: {
        chainId?: number;
        address?: string;
        isCoinId?: boolean;
    },
): Promise<Metadata> {
    const pageData = await runInSafeAsync(() => getTokenDetailPageData(token_symbol, coingecko_id, chain_id, address));
    if (pageData?.token) {
        return createTokenMetadataFromToken(pageData.token, pathname);
    }

    try {
        return await createTokenMetadata(fallbackKeyword, pathname, fallbackOptions);
    } catch {
        return createSiteMetadata(pathname);
    }
}
