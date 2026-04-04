'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { GridListInPage, type GridListInPageProps } from '@/components/GridListInPage.js';
import { getNFTItemContent, POAPGridListComponent } from '@/components/Profile/POAPList.js';
import { createIndicator } from '@/helpers/pageable.js';
import { getCollectionItems } from '@/providers/firefly/nft/getCollectionItems.js';
import { ErcType } from '@/providers/nftscan/types.js';
import { fillBookmarkStatusForNonFungibleAssets } from '@/services/fillBookmarkStatusForNFT.js';

interface NFTListProps extends Partial<GridListInPageProps> {
    address: string;
    chainId?: number;
}

export function NFTList(props: NFTListProps) {
    const { address, chainId, ...rest } = props;
    const queryResult = useSuspenseInfiniteQuery({
        initialPageParam: '',
        queryKey: ['nft-list', address.toLowerCase(), chainId],
        async queryFn({ pageParam }) {
            if (!chainId) return;
            const indicator = createIndicator(
                pageParam ? { index: 1, id: pageParam, __type__: 'PageIndicator' } : undefined,
                pageParam,
            );
            const response = await getCollectionItems(chainId, address, indicator);

            return {
                ...response,
                data: await fillBookmarkStatusForNonFungibleAssets(response.data),
            };
        },
        getNextPageParam: (lastPage) => lastPage?.nextIndicator?.id,
        select: (data) => data.pages.flatMap((page) => page?.data ?? []),
    });

    return (
        <GridListInPage
            {...rest}
            queryResult={queryResult}
            className="mt-2"
            VirtualGridListProps={{
                components: POAPGridListComponent,
                itemContent: (index, item) => {
                    return getNFTItemContent(index, item, {
                        ownerCount: item.erc_type === ErcType.ERC1155 && item.amount ? +item.amount : undefined,
                    });
                },
            }}
        />
    );
}
