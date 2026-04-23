import { queryOptions } from '@tanstack/react-query';
import type { Address } from 'viem';

import { mapPolymarketV2ToLegacy, type PolymarketPosition } from '@/providers/types/Firefly.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export interface ClaimableProceedsItem extends PolymarketPosition {
    won: number;
}

export function getPolymarketClaimableProceedsQueryOptions(proxyAddress: Address) {
    return queryOptions({
        queryKey: ['polymarket-claimable-proceeds', proxyAddress.toLowerCase()],
        async queryFn() {
            return getFireflyEndpoint().getPolymarketV2CurrentPositions(proxyAddress, {
                redeemable: true,
                offset: 0,
                limit: 200,
            });
        },
        enabled: Boolean(proxyAddress),
        select(positions): { totalWon: number; items: ClaimableProceedsItem[] } {
            const claimables = (positions || [])
                .map((p) => mapPolymarketV2ToLegacy(p, false))
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
