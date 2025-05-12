import { Trans } from '@lingui/react/macro';
import { compact, isFunction, orderBy, uniqBy } from 'lodash-es';
import { memo, type ReactNode } from 'react';

import { ListInPage } from '@/components/ListInPage.js';
import { Empty } from '@/components/Search/Empty.js';
import { getPostItemContent } from '@/components/VirtualList/getPostItemContent.js';
import { ScrollListKey, SearchType, Source } from '@/constants/enum.js';
import { EMPTY_LIST, REQUIRE_LOGIN_SOURCES_IN_SEARCH } from '@/constants/index.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useMultiInfiniteQueryPageable } from '@/hooks/useMultiInfiniteQueryPageable.js';

interface Props {
    keyword: string | string[];
    source: Source;
    searchType: SearchType;
    emptyMessage?: ReactNode | ((keyword: string | string[]) => ReactNode);
}

export const SearchPostList = memo<Props>(function SearchPostList({
    keyword: searchKeyword,
    searchType,
    source,
    emptyMessage,
}) {
    const currentSocialSource = narrowToSocialSource(source);
    const isLogin = useIsLogin(currentSocialSource);
    const loginRequired = REQUIRE_LOGIN_SOURCES_IN_SEARCH.includes(currentSocialSource);
    const keywordIsString = typeof searchKeyword === 'string';
    const invalidQuery = source === Source.Twitter && keywordIsString && (searchKeyword?.trim() || '').length < 2;
    const keywords = keywordIsString ? [searchKeyword] : searchKeyword;

    const queryResult = useMultiInfiniteQueryPageable(
        ['search', searchType, searchKeyword, source, isLogin],
        keywords.map((keyword) => ({
            key: keyword,
            queryFn: async ({ pageParam }) => {
                try {
                    if (!keyword?.trim() || invalidQuery || (loginRequired && !isLogin)) {
                        return createPageable(EMPTY_LIST, createIndicator(undefined, pageParam));
                    }
                    const provider = resolveSocialMediaProvider(currentSocialSource);
                    const indicator = pageParam ? createIndicator(undefined, pageParam) : undefined;

                    return await provider.searchPosts(keyword.replace(/^#/, ''), indicator);
                } catch {
                    return createPageable(EMPTY_LIST, createIndicator(undefined, pageParam));
                }
            },
        })),
        (data) => {
            const posts = compact(data.pages.flatMap((x) => x?.data ?? []));
            return orderBy(
                uniqBy(posts, (post) => post.postId),
                (x) => (x.timestamp ? -x.timestamp : 0),
            );
        },
    );

    const listKey = `${ScrollListKey.Search}:${searchType}:${keywords.join(',')}:${source}`;

    return (
        <ListInPage
            loginRequired={loginRequired}
            source={source}
            key={listKey}
            queryResult={queryResult}
            VirtualListProps={{
                listKey,
                computeItemKey: (index, post) => `${post.postId}_${index}`,
                itemContent: (index, post) => getPostItemContent(index, post, listKey),
            }}
            NoResultsFallbackProps={{
                message: isFunction(emptyMessage)
                    ? emptyMessage(keywords)
                    : (emptyMessage ?? (
                          <Empty
                              keyword={keywords.join(',')}
                              message={invalidQuery ? <Trans>Please enter at least 2 characters.</Trans> : undefined}
                          />
                      )),
            }}
        />
    );
});
