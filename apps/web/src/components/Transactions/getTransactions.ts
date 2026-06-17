import { Source } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { createIndicator, createPageable, type Pageable, type PageIndicator } from '@dimensiondev/utils';
import { polygon } from 'viem/chains';

import { getFollowingSwapTimeline } from '@/providers/firefly/endpoint/getFollowingSwapTimeline.js';
import { getSwapTimelineByAddress } from '@/providers/firefly/endpoint/getSwapTimelineByAddress.js';
import type { BetsActivity, SwapActivity, TransactionsItem } from '@/providers/types/Firefly.js';

function createTransactionsFetcher(
    fetchSwaps: (indicator: PageIndicator, chainId?: number) => Promise<Pageable<SwapActivity, PageIndicator>>,
    fetchBets: (indicator: PageIndicator) => Promise<Pageable<BetsActivity, PageIndicator>>,
) {
    return async function fetchTransactions(source: TransactionsItem['source'], pageParam?: string, chainId?: number) {
        switch (source) {
            case Source.Swap: {
                const result = await fetchSwaps(createIndicator(undefined, pageParam ?? ''), chainId);
                return {
                    ...result,
                    data: result.data.map((item) => ({
                        source,
                        data: item,
                        timestamp: Number(item.timestamp) * 1000,
                        id: item.hash,
                    })),
                };
            }
            case Source.Prediction: {
                if (chainId && chainId !== polygon.id) {
                    return createPageable([], createIndicator(undefined, pageParam));
                }

                const result = await fetchBets(createIndicator(undefined, pageParam ?? ''));
                return {
                    ...result,
                    data: result.data.map((item) => ({
                        source,
                        data: item,
                        timestamp: Number(item.timestamp) * 1000,
                        id: item.rawData.slug,
                    })),
                };
            }
            default:
                safeUnreachable(source);
                return createPageable([], createIndicator(undefined, pageParam));
        }
    };
}

export const getFollowingTransactions = createTransactionsFetcher(
    (indicator, chainId) => getFollowingSwapTimeline(chainId ? [chainId] : [], undefined, indicator, 30),
    (indicator) => Promise.resolve(createPageable([] as BetsActivity[], createIndicator(indicator))),
);

export function getProfileTransactions(
    source: TransactionsItem['source'],
    address: string,
    addresses: string[],
    pageParam?: string,
    chainId?: number,
) {
    const fetcher = createTransactionsFetcher(
        (indicator, chainId) => getSwapTimelineByAddress(addresses, chainId ? [chainId] : [], undefined, indicator),
        () => Promise.resolve(createPageable([] as BetsActivity[], createIndicator(undefined))),
    );

    return fetcher(source, pageParam, chainId);
}
