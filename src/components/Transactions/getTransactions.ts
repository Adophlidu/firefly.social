import { polygon } from 'viem/chains';

import { Source } from '@/constants/enum.js';
import { createIndicator, createPageable, type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { PolymarketActivity, SwapActivity, TransactionsItem } from '@/providers/types/Firefly.js';
import type { NFTFeedV3 } from '@/providers/types/NFTs.js';

function createTransactionsFetcher(
    fetchSwaps: (indicator: PageIndicator, chainId?: number) => Promise<Pageable<SwapActivity, PageIndicator>>,
    fetchBets: (indicator: PageIndicator) => Promise<Pageable<PolymarketActivity, PageIndicator>>,
    fetchNfts: (indicator: PageIndicator, chainId?: number) => Promise<Pageable<NFTFeedV3, PageIndicator>>,
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
            case Source.Polymarket: {
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
                        id: item.eventSlug,
                    })),
                };
            }
            case Source.NFTs: {
                const result = await fetchNfts(createIndicator(undefined, pageParam ?? ''), chainId);
                return {
                    ...result,
                    data: result.data.map((item) => ({
                        source,
                        data: item,
                        timestamp: Number(item.timestamp),
                        id: item.hash,
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
    (indicator, chainId) =>
        FireflyEndpointProvider.getFollowingSwapTimeline(chainId ? [chainId] : [], undefined, indicator, 30),
    (indicator) => FireflyEndpointProvider.getFollowingPolymarketTimeline('all', indicator, 10),
    (indicator) => Promise.resolve(createPageable([] as NFTFeedV3[], createIndicator(indicator))),
);

export const getForYouTransactions = createTransactionsFetcher(
    () => Promise.resolve(createPageable([] as SwapActivity[], createIndicator(undefined))),
    () => Promise.resolve(createPageable([] as PolymarketActivity[], createIndicator(undefined))),
    (indicator, chainId) => FireflyEndpointProvider.discoverNFTs({ indicator, chainId }),
);

export function getProfileTransactions(
    source: TransactionsItem['source'],
    address: string,
    addresses: string[],
    pageParam?: string,
    chainId?: number,
) {
    const fetcher = createTransactionsFetcher(
        (indicator, chainId) =>
            FireflyEndpointProvider.getSwapTimelineByAddress(addresses, chainId ? [chainId] : [], undefined, indicator),
        () => Promise.resolve(createPageable([] as PolymarketActivity[], createIndicator(undefined))),
        (indicator, chainId) =>
            FireflyEndpointProvider.getFollowingNFTs({
                indicator,
                chainId,
                walletAddress: address,
            }),
    );

    return fetcher(source, pageParam, chainId);
}
