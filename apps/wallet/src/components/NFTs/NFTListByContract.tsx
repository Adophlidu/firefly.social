import { EMPTY_LIST } from '@dimensiondev/constants';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { GridListInPage } from '@/components/GridListInPage.js';
import { getNFTItemContent, POAPGridListComponent } from '@/components/NFTs/POAPList.js';
import { type EthereumChainId } from '@/constants/ethereum.js';
import { createIndicator, createNextIndicator, createPageable } from '@/helpers/pageable.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function NFTListByContract(props: { contract: string; owner: string; chainId: EthereumChainId }) {
    const { contract, owner, chainId } = props;
    const queryResult = useSuspenseInfiniteQuery({
        initialPageParam: '',
        queryKey: ['nft-list-by-collection', contract.toLowerCase(), owner.toLowerCase(), chainId],
        async queryFn({ pageParam }) {
            const response = await getFireflyEndpoint().getUserCollectionNFTs(owner, chainId, contract, {
                cursor: pageParam,
            });
            const indicator = createIndicator(undefined, pageParam);
            return createPageable(
                response.nfts,
                createIndicator(undefined, pageParam),
                response.cursor && response.nfts.length ? createNextIndicator(indicator, response.cursor) : undefined,
            );
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
