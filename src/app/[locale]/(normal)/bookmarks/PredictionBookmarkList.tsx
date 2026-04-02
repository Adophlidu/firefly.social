import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';

import { ListInPage } from '@/components/ListInPage.js';
import { PredictionActivityItem } from '@/components/Prediction/PredictionActivityItem.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { createIndicator } from '@/helpers/pageable.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { getBetBookmarks } from '@/providers/firefly/endpoint/getBetBookmarks.js';
import { type BetsActivity } from '@/providers/types/Firefly.js';

function getPredictionActivityItem(index: number, activity: BetsActivity, onClick?: () => void) {
    return <PredictionActivityItem activity={activity} key={`${activity.slug}-${index}`} onLinkClick={onClick} />;
}

export function PredictionBookmarkList() {
    const isLogin = useIsLoginFirefly();
    const profileIds = useCurrentProfileIds();

    const query = useSuspenseInfiniteQuery({
        queryKey: ['bookmarks', Source.Prediction, profileIds],
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
            source={Source.Prediction}
            loginRequired
            key="bets"
            queryResult={query}
            VirtualListProps={{
                listKey: `${ScrollListKey.Bookmark}:${Source.Prediction}`,
                computeItemKey: (index, item) => `${item.slug}-${index}`,
                itemContent: (index, item) => getPredictionActivityItem(index, item),
            }}
        />
    );
}
