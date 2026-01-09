'use client';

import { uniqBy } from 'lodash-es';
import { useMemo } from 'react';

import { ChainIcon } from '@/components/ChainIcon.js';
import { GridListInPage } from '@/components/GridListInPage.js';
import { NFTImage } from '@/components/NFTImage.js';
import { POAPGridListComponent } from '@/components/Profile/POAPList.js';
import { TextOverflowTooltip } from '@/components/TextOverflowTooltip.js';
import { POAP_CONTRACT_ADDRESS } from '@/constants/static.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { createIndicator } from '@/helpers/pageable.js';
import { usePoapsByWallet } from '@/hooks/nft/usePoapsByWallet.js';
import { useMultiInfiniteQueryPageable } from '@/hooks/useMultiInfiniteQueryPageable.js';
import { getUserCollections } from '@/providers/firefly/nft/getUserCollections.js';
import { NFTSCAN_CHAIN_IDS } from '@/providers/nft-scan/constants.js';
import { type EVM } from '@/providers/nft-scan/types.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

interface NFTCollectionItemProps {
    collection: EVM.CollectionBasics;
    onClick?: (chainId: EthereumChainId, collectionId: string, collection: EVM.CollectionBasics) => void;
}

function NFTCollectionItem({ collection, onClick }: NFTCollectionItemProps) {
    const chainId = +collection.chain_id;
    const ownedTotal = collection.assets_total || 0;

    return (
        <div
            className="relative flex cursor-pointer flex-col rounded-lg bg-lightBg"
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
                    className="size-full rounded-lg object-cover"
                    src={collection.large_image_url || collection.logo_url}
                    alt="nft_image"
                />
                {ownedTotal > 1 ? (
                    <span className="light absolute bottom-1 right-1 h-5 rounded-lg bg-bg px-1 text-[10px] font-bold leading-5 text-main">
                        {`x ${nFormatter(ownedTotal)}`}
                    </span>
                ) : null}
            </div>
            <TextOverflowTooltip content={collection.name}>
                <div className="box-border h-6 items-center justify-center truncate p-1 px-4 text-center text-xs leading-4">
                    {collection.name}
                </div>
            </TextOverflowTooltip>
        </div>
    );
}

function getCollectionItemContent(index: number, props: NFTCollectionItemProps) {
    return (
        <NFTCollectionItem
            key={`${props.collection.chain_id}-${props.collection.contract_address}-${index}`}
            {...props}
        />
    );
}

interface NFTCollectionListProps {
    /** mix addresses */
    addresses: string[];
    /** current address */
    address: string;
    onClickCollection?: NFTCollectionItemProps['onClick'];
}

export function NFTCollectionList({ addresses, address, onClickCollection }: NFTCollectionListProps) {
    const addressesWithChain = useMemo(() => {
        const evmAddresses = addresses.filter(isValidAddressEthereum);
        return evmAddresses.flatMap((address) => NFTSCAN_CHAIN_IDS.map((x) => ({ chainId: x, address })));
    }, [addresses]);

    const { data: poaps } = usePoapsByWallet(address);
    const queryResult = useMultiInfiniteQueryPageable(
        ['nft-collection-list', addressesWithChain],
        addressesWithChain.map(({ chainId, address }) => ({
            key: [chainId, address].join(','),
            async queryFn({ pageParam }) {
                const indicator = createIndicator(undefined, pageParam);
                const response = await getUserCollections(chainId, address, indicator);
                return response;
            },
        })),
        (data) => {
            const collections = uniqBy(
                data.pages.flatMap((page) => page.data),
                (x) => `${x.chain_id}.${x.contract_address}`,
            ).filter((x) => x.name);
            if (!poaps.length) return collections;
            return [
                {
                    contract_address: POAP_CONTRACT_ADDRESS,
                    name: 'POAP',
                    chain_id: EthereumChainId.xDai,
                    assets_total: poaps.length,
                    logo_url: '/image/poap-logo.svg',
                    large_image_url: '/image/poap-logo.svg',
                } satisfies EVM.CollectionBasics,
                ...collections,
            ];
        },
    );

    return (
        <GridListInPage
            queryResult={queryResult}
            VirtualGridListProps={{
                components: POAPGridListComponent,
                itemContent: (index, collection) => {
                    return getCollectionItemContent(index, {
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
