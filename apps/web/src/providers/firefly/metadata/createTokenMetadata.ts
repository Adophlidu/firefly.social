import type { Metadata } from 'next';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { createTokenMetadataFromToken } from '@/helpers/createTokenMetadataFromToken.js';
import { searchTokenByKeyword } from '@/helpers/searchTokenByKeyword.js';

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
