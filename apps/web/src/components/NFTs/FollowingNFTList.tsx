'use client';

import { EMPTY_LIST } from '@dimensiondev/constants';
import { useMultiInfiniteQueryPageable } from '@dimensiondev/hooks';
import { createIndicator, createPageable } from '@dimensiondev/utils';
import { compact, sortBy } from 'lodash-es';

import { ListInPage } from '@/components/ListInPage.js';
import { getSingleFollowingNFTItemContent } from '@/components/NFTs/VirtualListHelper.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { getFollowingNFTs } from '@/providers/firefly/endpoint/getFollowingNFTs.js';
import { NFTSCAN_CHAIN_IDS } from '@/providers/nftscan/constants.js';

export function FollowingNFTList({ walletAddress }: { walletAddress?: string }) {
    const queryKey = walletAddress ? ['nfts-of', walletAddress.toLowerCase()] : ['nfts', 'following', Source.NFTs];
    const queryResult = useMultiInfiniteQueryPageable(
        [...queryKey, ...NFTSCAN_CHAIN_IDS],
        NFTSCAN_CHAIN_IDS.map((chainId) => ({
            key: chainId.toString(),
            async queryFn({ pageParam }) {
                const indicator = createIndicator(undefined, pageParam);
                if (!walletAddress) {
                    return createPageable(EMPTY_LIST, indicator);
                }
                return getFollowingNFTs({
                    indicator: createIndicator(undefined, pageParam),
                    chainId,
                    walletAddress,
                });
            },
        })),
        (data) => {
            return sortBy(compact(data.pages.flatMap((p) => p?.data)), (x) => -x.timestamp);
        },
    );

    if (!walletAddress) {
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
