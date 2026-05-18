import { Source } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { createIndicator, createPageable, type Pageable, type PageIndicator } from '@dimensiondev/utils';
import { polygon } from 'viem/chains';

import { discoverNFTs } from '@/providers/firefly/endpoint/discoverNFTs.js';
import { getFollowingNFTs } from '@/providers/firefly/endpoint/getFollowingNFTs.js';
import { getFollowingSwapTimeline } from '@/providers/firefly/endpoint/getFollowingSwapTimeline.js';
import { getSwapTimelineByAddress } from '@/providers/firefly/endpoint/getSwapTimelineByAddress.js';
import type { BetsActivity, SwapActivity, TransactionsItem } from '@/providers/types/Firefly.js';
import type { NFTFeedV3 } from '@/providers/types/NFTs.js';

function createTransactionsFetcher(
    fetchSwaps: (indicator: PageIndicator, chainId?: number) => Promise<Pageable<SwapActivity, PageIndicator>>,
    fetchBets: (indicator: PageIndicator) => Promise<Pageable<BetsActivity, PageIndicator>>,
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
    (indicator, chainId) => getFollowingSwapTimeline(chainId ? [chainId] : [], undefined, indicator, 30),
    (indicator) => Promise.resolve(createPageable([] as BetsActivity[], createIndicator(indicator))),
    (indicator) => Promise.resolve(createPageable([] as NFTFeedV3[], createIndicator(indicator))),
);

export const getForYouTransactions = createTransactionsFetcher(
    () => Promise.resolve(createPageable([] as SwapActivity[], createIndicator(undefined))),
    () => Promise.resolve(createPageable([] as BetsActivity[], createIndicator(undefined))),
    (indicator, chainId) => discoverNFTs({ indicator, chainId }),
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
        (indicator, chainId) =>
            getFollowingNFTs({
                indicator,
                chainId,
                walletAddress: address,
            }),
    );

    return fetcher(source, pageParam, chainId);
}
