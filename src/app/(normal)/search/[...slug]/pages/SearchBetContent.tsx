import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { BetItem } from '@/components/BetItem.js';
import { ListInPage } from '@/components/ListInPage.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { createIndicator } from '@/helpers/pageable.js';
import { searchBets } from '@/providers/firefly/bets/searchBets.js';
import { type PolymarketEventListData } from '@/providers/types/Firefly.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';

function getBetsItemContent(_: number, data: PolymarketEventListData) {
    return <BetItem key={data.id} event={data} />;
}

export function SearchBetContent() {
    const { searchKeyword, searchType, source } = useSearchStateStore();

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['search', searchType, searchKeyword, source],
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            return searchBets({
                keyword: searchKeyword,
                indicator,
                limit: 20,
                sort: 'volume_24hr',
                eventsStatus: 'active',
                searchTags: true,
            });
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length === 0) return undefined;
            return lastPage?.nextIndicator?.id;
        },
        select: (data) => data.pages.flatMap((x) => x?.data || []),
    });

    return (
        <div className="px-4 py-2">
            <ListInPage
                queryResult={queryResult}
                source={Source.Bets}
                VirtualListProps={{
                    listKey: `${ScrollListKey.Bets}:explore:${source}`,
                    computeItemKey: (index, item) => `${item.id}-${index}`,
                    itemContent: getBetsItemContent,
                }}
                NoResultsFallbackProps={{
                    message: <Trans>No predictions found</Trans>,
                }}
            />
        </div>
    );
}
