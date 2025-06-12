'use client';

import { uniqBy } from 'lodash-es';
import { useMemo } from 'react';

import { GridListInPage } from '@/components/GridListInPage.js';
import { ChainIcon } from '@/components/NFTDetail/ChainIcon.js';
import { NFTImage } from '@/components/NFTImage.js';
import { POAPGridListComponent } from '@/components/Profile/POAPList.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { createIndicator } from '@/helpers/pageable.js';
import { useMultiInfiniteQueryPageable } from '@/hooks/useMultiInfiniteQueryPageable.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { NFTSCAN_CHAIN_IDS } from '@/providers/nft-scan/constants.js';
import type { EVM } from '@/providers/nft-scan/types.js';
import { EthereumChainId } from '#masknet/web3-shared-evm';

interface NFTCollectionItemProps {
    collection: EVM.Collection;
    onClick?: (chainId: EthereumChainId, collectionId: string, collection: EVM.Collection) => void;
}

function NFTCollectionItem({ collection, onClick }: NFTCollectionItemProps) {
    const chainId = +collection.chain_id;

    return (
        <div
            className="relative flex cursor-pointer flex-col rounded-lg bg-bg pb-1 sm:rounded-2xl"
            onClick={() => {
                onClick?.(chainId ?? EthereumChainId.Mainnet, collection.contract_address, collection);
            }}
        >
            {chainId ? (
                <div className="absolute left-1 top-1 z-10">
                    <ChainIcon chainId={chainId} size={20} />
                </div>
            ) : null}
            <div className="relative aspect-square h-auto w-full overflow-hidden">
                <NFTImage
                    width={500}
                    height={500}
                    className="h-full w-full rounded-lg object-cover"
                    src={collection.large_image_url || collection.logo_url}
                    alt="nft_image"
                />
                {collection.items_total > 1 ? (
                    <span className="absolute bottom-1 right-1 h-5 rounded-lg bg-bg px-1 text-[10px] font-bold leading-5 text-main drop-shadow-lg">
                        {`x ${nFormatter(collection.items_total)}`}
                    </span>
                ) : null}
            </div>
            <div className="mt-1 line-clamp-2 h-8 w-full px-1 text-center text-xs font-medium leading-4 sm:mt-2 sm:px-2 sm:py-0">
                {collection.name}
            </div>
        </div>
    );
}

function getNFTItemContent(index: number, props: NFTCollectionItemProps) {
    return (
        <NFTCollectionItem
            key={`${props.collection.chain_id}-${props.collection.contract_address}-${index}`}
            {...props}
        />
    );
}

interface NFTCollectionListProps {
    addresses: string[];
    onClickCollection?: NFTCollectionItemProps['onClick'];
}

export function NFTCollectionList(props: NFTCollectionListProps) {
    const { addresses, onClickCollection } = props;

    const addressesWithChain = useMemo(() => {
        const evmAddresses = addresses.filter(isValidAddressEthereum);
        return evmAddresses.flatMap((address) => NFTSCAN_CHAIN_IDS.map((x) => ({ chainId: x, address })));
    }, [addresses]);

    const queryResult = useMultiInfiniteQueryPageable(
        ['nft-collection-list', addressesWithChain],
        addressesWithChain.map(({ chainId, address }) => ({
            key: [chainId, address].join(','),
            async queryFn({ pageParam }) {
                const indicator = createIndicator(undefined, pageParam);
                const response = await FireflyEndpointProvider.getUserCollections(chainId, address, indicator);
                return response;
            },
        })),
        (data) =>
            uniqBy(
                data.pages.flatMap((page) => page.data),
                (x) => `${x.chain_id}.${x.contract_address}`,
            ),
    );

    return (
        <GridListInPage
            queryResult={queryResult}
            VirtualGridListProps={{
                components: POAPGridListComponent,
                itemContent: (index, collection) => {
                    return getNFTItemContent(index, {
                        collection,
                        onClick: onClickCollection,
                    });
                },
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
