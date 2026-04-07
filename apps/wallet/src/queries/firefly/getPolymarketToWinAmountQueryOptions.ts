import { queryOptions } from '@tanstack/react-query';

import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function getPolymarketToWinAmountQueryOptions(
    side: 'BUY' | 'SELL',
    tokenId: string,
    debouncedAmount: string | number,
    options?: {
        isLimit?: boolean;
        limitPrice?: number;
    },
) {
    return queryOptions({
        queryKey: [
            'polymarket-to-win-amount',
            tokenId,
            side,
            debouncedAmount,
            options?.isLimit ?? false,
            options?.limitPrice,
        ],
        queryFn() {
            return getFireflyEndpoint().getPolymarketToWinAmount(
                tokenId,
                side,
                debouncedAmount,
                options?.isLimit ?? false,
                options?.limitPrice,
            );
        },
    });
}
