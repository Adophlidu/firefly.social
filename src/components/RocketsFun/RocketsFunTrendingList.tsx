import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { ListInPage } from '@/components/ListInPage.js';
import { TokenInList } from '@/components/RocketsFun/TokenInList.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { createIndicator } from '@/helpers/pageable.js';
import { RocketsFunProvider } from '@/providers/rockets-fun/index.js';
import type { RocketsFunToken } from '@/providers/types/RocketsFun.js';

function getTokenContent(index: number, token: RocketsFunToken, listKey: string) {
    return <TokenInList key={token.id} token={token} />;
}

interface Props {}

export function RocketsFunTrendingList(props: Props) {
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['rockets-fun-trending', 'discover'],
        networkMode: 'always',
        queryFn: async ({ pageParam }) => {
            return RocketsFunProvider.getMarketTokens(undefined, createIndicator(undefined, pageParam));
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) => data.pages.flatMap((x) => x.data),
    });

    const listKey = `${ScrollListKey.Discover}:${Source.RocketsFun}`;

    return (
        <ListInPage
            source={Source.RocketsFun}
            key={ScrollListKey.RocketsFunTrending}
            queryResult={queryResult}
            VirtualListProps={{
                listKey,
                computeItemKey: (index, token) => `${token.id}_${index}`,
                itemContent: (index, token) => getTokenContent(index, token, listKey),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
