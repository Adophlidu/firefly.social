'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';

import { ListInPage } from '@/components/ListInPage.js';
import { Empty } from '@/components/Search/Empty.js';
import { SearchableCollectionItem } from '@/components/Search/SearchableCollectionItem.js';
import { ScrollListKey } from '@/constants/enum.js';
import { type EVM } from '@/providers/nftscan/types.js';
import { searchCollections } from '@/services/searchCollections.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';

const getSearchItemContent = (collection: EVM.Collection) => {
    return <SearchableCollectionItem key={collection.contract_address} collection={collection} />;
};

function filterAndSortCollections(collections: EVM.Collection[], keyword: string) {
    return collections
        .filter((collection) => collection.owners_total >= 50)
        .sort((a, b) => {
            if (a.name.toLowerCase() === keyword.toLowerCase()) return -1;
            return b.items_total - a.items_total;
        });
}

export function SearchCollectionContent() {
    const { searchKeyword, searchType, source } = useSearchStateStore();

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['search', searchType, searchKeyword, source],
        queryFn: async () => {
            if (!searchKeyword) return;

            return searchCollections(searchKeyword);
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length === 0) return;
            return lastPage?.nextIndicator?.id;
        },
        select(data) {
            return filterAndSortCollections(compact(data.pages.flatMap((x) => x?.data ?? [])), searchKeyword);
        },
    });

    const listKey = `${ScrollListKey.Search}:${searchType}:${searchKeyword}:${source}`;

    return (
        <ListInPage
            source={source}
            key={listKey}
            queryResult={queryResult}
            VirtualListProps={{
                listKey,
                computeItemKey: (index, collection) => `${collection.contract_address}_${index}`,
                itemContent: (_, collection) => getSearchItemContent(collection),
            }}
            NoResultsFallbackProps={{
                message: <Empty keyword={searchKeyword} />,
            }}
        />
    );
}
