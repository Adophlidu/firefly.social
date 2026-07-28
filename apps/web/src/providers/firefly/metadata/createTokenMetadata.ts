import type { Metadata } from '@/compat/nextMetadata.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { createTokenMetadataFromToken } from '@/providers/firefly/metadata/createTokenMetadataFromToken.js';
import { searchTokenByKeyword } from '@/providers/firefly/metadata/searchTokenByKeyword.js';

export async function createTokenMetadata(
    keyword: string,
    pathname: string,
    options?: {
        chainId?: number;
        address?: string;
        isCoinId?: boolean;
    },
): Promise<Metadata> {
    const token = await searchTokenByKeyword(keyword, options);
    if (!token) return createSiteMetadata(pathname);
    return createTokenMetadataFromToken(token, pathname);
}
