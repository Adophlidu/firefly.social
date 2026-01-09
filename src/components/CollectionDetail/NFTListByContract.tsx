'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { GridListInPage } from '@/components/GridListInPage.js';
import { getNFTItemContent, POAPGridListComponent } from '@/components/Profile/POAPList.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { createIndicator } from '@/helpers/pageable.js';
import { getUserCollectionNFTs } from '@/providers/firefly/nft/getUserCollectionNFTs.js';
import { type EthereumChainId } from '@/web3-shared/evm/types.js';

export function NFTListByContract(props: { contract: string; owner: string; chainId: EthereumChainId }) {
    const { contract, owner, chainId } = props;
    const queryResult = useSuspenseInfiniteQuery({
        initialPageParam: '',
        queryKey: ['nft-list-by-collection', contract, owner, chainId],
        async queryFn({ pageParam }) {
            const indicator = createIndicator(
                pageParam ? { index: 1, id: pageParam, __type__: 'PageIndicator' } : undefined,
                pageParam,
            );

            return getUserCollectionNFTs(owner, chainId, contract, indicator);
        },
        getNextPageParam: (lastPage) => lastPage?.nextIndicator?.id,
        select: (data) => data.pages.flatMap((page) => page.data ?? EMPTY_LIST),
    });

    return (
        <GridListInPage
            queryResult={queryResult}
            className="mt-2"
            VirtualGridListProps={{
                components: POAPGridListComponent,
                itemContent: (index, item) => {
                    return getNFTItemContent(index, item, {
                        isShowChainIcon: true,
                    });
                },
            }}
        />
    );
}
