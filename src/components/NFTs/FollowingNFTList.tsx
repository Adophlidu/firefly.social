'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';

import { ListInPage } from '@/components/ListInPage.js';
import { getSingleFollowingNFTItemContent } from '@/components/NFTs/VirtualListHelper.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { createIndicator } from '@/helpers/pageable.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export function FollowingNFTList({ walletAddresses }: { walletAddresses?: string[] }) {
    const profileIds = useCurrentProfileIds();
    const queryKey = walletAddresses
        ? ['nfts-of', ...walletAddresses, profileIds]
        : ['nfts', 'following', Source.NFTs, profileIds];
    const queryResult = useSuspenseInfiniteQuery({
        queryKey,
        networkMode: 'always',
        queryFn: async ({ pageParam }) => {
            if (!walletAddresses && !profileIds.length) return null;
            return FireflyEndpointProvider.getFollowingNFTs({
                indicator: createIndicator(undefined, pageParam),
                walletAddresses,
            });
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage?.nextIndicator?.id,
        select: (data) => compact(data.pages.flatMap((p) => p?.data)),
    });

    if (!walletAddresses && !profileIds.length) {
        return <NotLoginFallback source={Source.NFTs} className="md:!pt-0" />;
    }

    return (
        <ListInPage
            source={Source.NFTs}
            queryResult={queryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.Following}:${Source.NFTs}`,
                computeItemKey: (index, nft) => `${nft.hash}-${index}`,
                itemContent: (index, nft) =>
                    getSingleFollowingNFTItemContent(index, nft, {
                        listKey: `${ScrollListKey.Following}:${Source.NFTs}`,
                    }),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
