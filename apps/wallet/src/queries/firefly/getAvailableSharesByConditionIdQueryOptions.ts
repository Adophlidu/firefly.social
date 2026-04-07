import { queryOptions } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import { type Address } from 'viem';

import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function getAvailableSharesByConditionIdQueryOptions(
    proxyAddress: Address,
    conditionId: string,
    tokenId: string,
) {
    return queryOptions({
        queryKey: ['polymarket-positions-info', proxyAddress.toLowerCase(), conditionId, tokenId],
        async queryFn() {
            return getFireflyEndpoint().getPolymarketPositionsInfo(proxyAddress, {
                cursor: 0,
                limit: 200,
                isPolymarketProxy: true,
                isClaim: false,
                excludeWin: false,
                conditionId,
            });
        },
        select(res) {
            const list = res?.data ?? [];
            const position = list.find((x) => x?.tokenId === tokenId);
            const n = BigNumber(position?.shares ?? 0);
            return n.isFinite() ? n.toFixed() : '0';
        },
    });
}
