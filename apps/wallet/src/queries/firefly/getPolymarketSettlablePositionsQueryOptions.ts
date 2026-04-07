import { EMPTY_LIST } from '@dimensiondev/constants';
import { queryOptions } from '@tanstack/react-query';
import { type Address } from 'viem';

import { type PolymarketPosition } from '@/providers/types/Firefly.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export interface SettlablePositionsResult {
    winningItems: PolymarketPosition[];
    losingItems: PolymarketPosition[];
    totalWinAmount: number;
    allItems: PolymarketPosition[];
}

function sortByClosedTimeDesc(a: PolymarketPosition, b: PolymarketPosition) {
    return (b.closed_time ?? 0) - (a.closed_time ?? 0);
}

export function getPolymarketSettlablePositionsQueryOptions(proxyAddress: Address) {
    return queryOptions({
        queryKey: ['polymarket-settlable-positions', proxyAddress.toLowerCase()],
        async queryFn() {
            return getFireflyEndpoint().getPolymarketSettlablePositions(proxyAddress, {
                isPolymarketProxy: true,
                limit: 50,
                excludeWin: false,
                excludeLose: false,
            });
        },
        enabled: Boolean(proxyAddress),
        select(payload): SettlablePositionsResult {
            const list = payload?.data ?? EMPTY_LIST;
            const winningItems: PolymarketPosition[] = [];
            const losingItems: PolymarketPosition[] = [];

            for (const item of list) {
                if (!item.isClaimable || item.shares <= 0) continue;
                if (item.isWin) {
                    winningItems.push(item);
                } else {
                    losingItems.push(item);
                }
            }

            winningItems.sort(sortByClosedTimeDesc);
            losingItems.sort(sortByClosedTimeDesc);

            // Calculate total win amount (shares = win amount for winning positions)
            const totalWinAmount = winningItems.reduce((sum, x) => sum + (x.shares ?? 0), 0);

            // All items combined, wins first then losses
            const allItems = [...winningItems, ...losingItems];

            return { winningItems, losingItems, totalWinAmount, allItems };
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}
