import { EMPTY_LIST } from '@dimensiondev/constants';
import { queryOptions } from '@tanstack/react-query';
import { type Address } from 'viem';

import { type PolymarketPosition } from '@/providers/types/Firefly.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export interface ClaimableProceedsItem extends PolymarketPosition {
    won: number;
}

export function getPolymarketClaimableProceedsQueryOptions(proxyAddress: Address) {
    return queryOptions({
        queryKey: ['polymarket-claimable-proceeds', proxyAddress.toLowerCase()],
        async queryFn() {
            return getFireflyEndpoint().getPolymarketCurrentPositions(proxyAddress, true);
        },
        enabled: Boolean(proxyAddress),
        select(payload): { totalWon: number; items: ClaimableProceedsItem[] } {
            const list = payload?.data ?? EMPTY_LIST;
            const claimables = list
                // For winning outcome, claimable proceeds ~= shares (1 share = $1).
                .filter((x) => x.isClaimable && x.isWin && Number.isFinite(x.shares) && x.shares > 0)
                .map((x) => ({ ...x, won: x.shares }));

            claimables.sort((a, b) => b.won - a.won);
            const totalWon = claimables.reduce((sum, x) => sum + x.won, 0);
            return { totalWon, items: claimables };
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}
