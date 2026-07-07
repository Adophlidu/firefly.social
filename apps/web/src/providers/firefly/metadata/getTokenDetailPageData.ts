import { runInSafeAsync } from '@dimensiondev/utils';
import type { GetTokenOptions } from '@dimensiondev/workers-token';
import { cache } from 'react';

import { getCoinTrending } from '@/providers/coingecko/getCoinTrending.js';
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
