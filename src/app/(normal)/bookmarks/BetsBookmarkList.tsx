import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';

import { BetsActivityItem } from '@/components/Bets/BetsActivityItem.js';
import { ListInPage } from '@/components/ListInPage.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { createIndicator } from '@/helpers/pageable.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { getBetBookmarks } from '@/providers/firefly/endpoint/getBetBookmarks.js';
import { type BetsActivity } from '@/providers/types/Firefly.js';

function getBetsActivityItem(index: number, activity: BetsActivity, onClick?: () => void) {
    return <BetsActivityItem activity={activity} key={`${activity.slug}-${index}`} onLinkClick={onClick} />;
}

export function BetsBookmarkList() {
    const isLogin = useIsLoginFirefly();
    const profileIds = useCurrentProfileIds();

    const query = useSuspenseInfiniteQuery({
        queryKey: ['bookmarks', Source.Bets, profileIds],
        queryFn: async ({ pageParam }) => {
            if (!isLogin) return;
            return getBetBookmarks(createIndicator(undefined, pageParam));
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length === 0) return;
            return lastPage?.nextIndicator?.id;
        },
        select: (data) => compact(data.pages.flatMap((x) => x?.data)),
    });

    return (
        <ListInPage
            source={Source.Bets}
            loginRequired
            key="bets"
            queryResult={query}
            VirtualListProps={{
                listKey: `${ScrollListKey.Bookmark}:${Source.Bets}`,
                computeItemKey: (index, item) => `${item.slug}-${index}`,
                itemContent: (index, item) => getBetsActivityItem(index, item),
            }}
        />
    );
}
