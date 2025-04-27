'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { ListInPage } from '@/components/ListInPage.js';
import { getSingleNFTFeedItemContent } from '@/components/NFTs/VirtualListHelper.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { createIndicator } from '@/helpers/pageable.js';
import { resolveNFTFeedChainId } from '@/helpers/resolveNFTFeedChainId.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export function DiscoverNFTList() {
    const nftQueryResult = useSuspenseInfiniteQuery({
        queryKey: ['nfts', 'discover'],
        networkMode: 'always',
        async queryFn({ pageParam }) {
            return await FireflyEndpointProvider.discoverNFTs({
                indicator: createIndicator(undefined, pageParam),
            });
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) => data.pages.flatMap((p) => p.data),
    });

    return (
        <ListInPage
            source={Source.NFTs}
            queryResult={nftQueryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.Discover}:${Source.NFTs}`,
                computeItemKey: (index, nftFeed) => `${nftFeed.id}-${index}`,
                itemContent: (index, nftFeed) =>
                    getSingleNFTFeedItemContent(index, nftFeed, resolveNFTFeedChainId(nftFeed), {
                        listKey: `${ScrollListKey.Discover}:${Source.NFTs}`,
                    }),
                overscan: 2000,
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
