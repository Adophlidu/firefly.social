'use client';

import { createIndicator } from '@dimensiondev/utils';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';

import { ListInPage } from '@/components/ListInPage.js';
import { getArticleItemContent } from '@/components/VirtualList/getArticleItemContent.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { getBookmarks } from '@/providers/firefly/article/getBookmarks.js';

export function ArticleBookmarkList() {
    const isLogin = useIsLoginFirefly();
    const profileIds = useCurrentProfileIds();
    const query = useSuspenseInfiniteQuery({
        queryKey: ['posts', Source.Article, 'bookmark', profileIds],
        queryFn: async ({ pageParam }) => {
            if (!isLogin) return null;
            const result = await getBookmarks(createIndicator(undefined, pageParam));
            return result;
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
            source={Source.Article}
            loginRequired
            key="article"
            queryResult={query}
            VirtualListProps={{
                listKey: `${ScrollListKey.Bookmark}:${Source.Article}`,
                computeItemKey: (index, article) => `${article.id}-${article.hash}-${index}`,
                itemContent: (index, article) =>
                    getArticleItemContent(index, article, `${ScrollListKey.Bookmark}:${Source.Article}`, {
                        isBookmark: true,
                    }),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
