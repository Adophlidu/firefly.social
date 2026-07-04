import { runInSafeAsync } from '@dimensiondev/utils';
import type { GetTokenOptions } from '@dimensiondev/workers-token';
import type { Metadata } from 'next';
import { cache } from 'react';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { createTokenMetadataFromToken } from '@/helpers/createTokenMetadataFromToken.js';
import { getCoinTrending } from '@/providers/coingecko/getCoinTrending.js';
import { createTokenMetadata } from '@/providers/firefly/metadata/createTokenMetadata.js';
import { searchToken } from '@/providers/firefly/worker/searchToken.js';
import type { Trending } from '@/providers/types/Trending.js';

export interface TokenDetailPageData {
    token: NonNullable<Awaited<ReturnType<typeof searchToken>>>;
    tokenQueryOptions: GetTokenOptions;
    initialTrending?: Trending;
}

// react `cache()` memoizes by argument identity — pass primitive fields so layout and metadata share one fetch.
export const getTokenDetailPageData = cache(
    async (
        token_symbol: string | undefined,
        coingecko_id: string | undefined,
        chain_id: number | undefined,
        address: string | undefined,
    ): Promise<TokenDetailPageData | null> => {
        const tokenQueryOptions: GetTokenOptions = {
            token_symbol,
            coingecko_id,
            chain_id,
            address,
        };
        const token = await runInSafeAsync(() => searchToken(tokenQueryOptions));
        if (!token) return null;

        const initialTrending = token.id ? await runInSafeAsync(() => getCoinTrending(token.id!)) : undefined;

        return { token, tokenQueryOptions, initialTrending };
    },
);

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
