import { queryOptions } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import type { Address } from 'viem';

import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function getAvailableSharesByConditionIdQueryOptions(
    proxyAddress: Address,
    conditionId: string,
    tokenId: string,
) {
    return queryOptions({
        queryKey: ['polymarket-positions-info', proxyAddress.toLowerCase(), conditionId, tokenId],
        async queryFn() {
            return getFireflyEndpoint().getPolymarketV2CurrentPositions(proxyAddress, {
                limit: 200,
            });
        },
        select(positions) {
            const list = positions ?? [];
            const position = list.find((x) => x?.conditionId === conditionId && x?.asset === tokenId);
            const n = BigNumber(position?.size ?? 0);
            return n.isFinite() ? n.toFixed() : '0';
        },
    });
}
