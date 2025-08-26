import { t } from '@lingui/core/macro';
import Fuse from 'fuse.js';
import { memo, useCallback, useMemo, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';

import { ChainIcon } from '@/components/ChainIcon.js';
import { SearchContentPanel } from '@/components/Search/SearchContentPanel.js';
import { chains } from '@/configs/chains.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { formatCustomNFTScanCollection } from '@/helpers/formatCustomNFTScanCollection.js';
import { useCustomNonFungibleTokens } from '@/hooks/useCustomNonFungibleTokens.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useNFTCollections } from '@/hooks/useNFTCollections.js';
import { type Collection, CollectionItem } from '@/modals/NonFungibleCollectionSelectModal/CollectionItem.js';
import { NFTSCAN_CHAIN_IDS } from '@/providers/nft-scan/constants.js';
import { EthereumSchemaType } from '@/web3-shared/evm/types.js';

interface NonFungibleCollectionSelectPanelProps {
    onSelected?: (selected: Collection) => void;
    isSelected?: (item: Collection) => boolean;
}

function renderCollection(collection: Collection) {
    return <CollectionItem key={collection.id} collection={collection} />;
}

export default memo<NonFungibleCollectionSelectPanelProps>(function NonFungibleCollectionSelectPanel({
    onSelected,
    isSelected,
}) {
    const isMedium = useIsMedium('max');
    const currentChainId = useChainId();
    const defaultChainId = NFTSCAN_CHAIN_IDS.includes(currentChainId) ? currentChainId : NFTSCAN_CHAIN_IDS[0];
    const [chainId = defaultChainId, setChainId] = useState<number>();
    const account = useAccount();

    const { data: allCollections = EMPTY_LIST, isLoading } = useNFTCollections({
        account: account.address,
        chainId,
        schemaType: EthereumSchemaType.ERC721,
    });
    const { data: customNonFungibleTokens = EMPTY_LIST } = useCustomNonFungibleTokens();
    const collections = useMemo(
        () =>
            customNonFungibleTokens
                .map((x) => formatCustomNFTScanCollection(x, true))
                .concat(allCollections.map((x) => formatCustomNFTScanCollection(x, false)))
                .filter((x) => (chainId ? x.chainId === chainId : true)),
        [allCollections, chainId, customNonFungibleTokens],
    );

    const getChainItem = useCallback(
        (chainId: number, isTag?: boolean) => {
            const chain = chains.find((chain) => chain.id === chainId);
            if (!chain) return null;

            return (
                <div className="flex items-center gap-2">
                    <ChainIcon chainId={chainId} size={15} />
                    {isMedium && isTag ? null : <span>{chain.name}</span>}
                </div>
            );
        },
        [isMedium],
    );

    const fuse = useMemo(() => {
        return new Fuse(collections, {
            keys: [
                { name: 'name', weight: 0.5 },
                { name: 'symbol', weight: 0.8 },
                { name: 'address', weight: 1 },
            ],
            shouldSort: true,
            threshold: 0.45,
            minMatchCharLength: 3,
        });
    }, [collections]);

    const [keyword, setKeyword] = useState('');
    const filteredCollections = useMemo(() => {
        if (!keyword) return collections;
        return fuse
            .search(keyword)
            .filter((x) => (chainId ? x.item.chainId === chainId : true))
            .map((result) => result.item);
    }, [chainId, fuse, keyword, collections]);

    return (
        <SearchContentPanel<Collection, number>
            isLoading={isLoading}
            placeholder={t`Search collection`}
            filterProps={{
                placeholder: t`All chains`,
                data: NFTSCAN_CHAIN_IDS,
                popoverClassName: 'w-[150px]',
                itemRenderer: (chainId, isTag) => getChainItem(chainId, isTag),
                isSelected: (item, current) => item === current,
                selected: chainId,
                onSelected: setChainId,
            }}
            keyword={keyword}
            onSearch={setKeyword}
            data={filteredCollections}
            itemRenderer={renderCollection}
            onSelected={onSelected}
            listKey={(token) => `${token.chainId}/${token.address}/${token.custom}`}
            isSelected={isSelected}
        />
    );
});
