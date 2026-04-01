'use client';

import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { Link } from '@/components/Link.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { SearchableCollectionItem } from '@/components/Search/SearchableCollectionItem.js';
import { SearchType } from '@/constants/enum.js';
import { STALE_TIMES } from '@/constants/query.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';
import { searchCollections } from '@/services/searchCollections.js';

interface SuggestCollectionListProps {
    query: string;
    onSelect?: () => void;
}

export const SuggestCollectionList = memo<SuggestCollectionListProps>(function SuggestCollectionList({
    query,
    onSelect,
}) {
    const { data: collections, isLoading } = useQuery({
        queryKey: ['search-suggest', 'collections', query],
        staleTime: STALE_TIMES.MINUTE_5,

        queryFn: async () => {
            const data = await searchCollections(query);
            return data.data;
        },
        enabled: !!query,
    });

    return (
        <div>
            <h2 className="border-t border-line p-3 pb-2 text-sm font-bold leading-[18px]">
                <Trans>Collections</Trans>
            </h2>
            {isLoading ? (
                <div className="flex flex-col items-center space-y-2 px-4 pb-5 pt-2 text-center text-sm font-bold">
                    <LoadingIcon />
                    <div className="font-bold">
                        <Trans>Searching collections</Trans>
                    </div>
                </div>
            ) : collections?.length ? (
                <div>
                    {collections.slice(0, 5).map((collection) => (
                        <SearchableCollectionItem
                            className="!border-0 !py-2"
                            key={collection.contract_address}
                            collection={collection}
                            onClick={onSelect}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-2 p-4 text-center text-sm font-bold">
                    <div className="font-bold">
                        <Trans>No matching collection</Trans>
                    </div>
                </div>
            )}
            <div className="px-3 pb-4 pt-2">
                <Link className="text-sm leading-[18px] text-secondary" href={resolveSearchUrl(query, SearchType.NFTs)}>
                    <Trans>Show more collections</Trans>
                </Link>
            </div>
        </div>
    );
});
