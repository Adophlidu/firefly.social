import { Trans } from '@lingui/react/macro';
import { compact, isFunction, uniqBy } from 'lodash-es';
import { memo, type ReactNode } from 'react';

import { ListInPage } from '@/components/ListInPage.js';
import { Empty } from '@/components/Search/Empty.js';
import { getPostItemContent } from '@/components/VirtualList/getPostItemContent.js';
import { ScrollListKey, type SearchType, Source } from '@/constants/enum.js';
import { EMPTY_LIST, REQUIRE_LOGIN_SOURCES_IN_SEARCH } from '@/constants/static.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useMultiInfiniteQueryPageable } from '@/hooks/useMultiInfiniteQueryPageable.js';
import { searchPosts } from '@/providers/x3pro/searchPosts.js';
import { type PostOrderType } from '@/providers/x3pro/types.js';

interface Props {
    keyword: string | string[];
    source: Source;
    searchType: SearchType;
    emptyMessage?: ReactNode | ((keyword: string | string[]) => ReactNode);
    orderType?: PostOrderType;
    loading?: ReactNode;
}

export const SearchPostList = memo<Props>(function SearchPostList({
    keyword: searchKeyword,
    searchType,
    source,
    emptyMessage,
    orderType,
    loading,
}) {
    const socialSource = narrowToSocialSource(source);
    const isLogin = useIsLogin(socialSource);
    const loginRequired = source !== Source.X3Pro && REQUIRE_LOGIN_SOURCES_IN_SEARCH.includes(socialSource);
    const keywordIsString = typeof searchKeyword === 'string';
    const invalidQuery = source === Source.Twitter && keywordIsString && (searchKeyword?.trim() || '').length < 2;
    const keywords = keywordIsString ? [searchKeyword] : searchKeyword;

    const queryResult = useMultiInfiniteQueryPageable(
        ['search', searchType, source, searchKeyword, orderType, isLogin],
        keywords.map((keyword) => ({
            key: keyword,
            queryFn: async ({ pageParam }) => {
                try {
                    if (!keyword?.trim() || invalidQuery || (loginRequired && !isLogin)) {
                        return createPageable(EMPTY_LIST, createIndicator(undefined, pageParam));
                    }
                    const indicator = pageParam ? createIndicator(undefined, pageParam) : undefined;
                    if (source === Source.X3Pro) {
                        return searchPosts(keyword, indicator, orderType);
                    }
                    const provider = resolveSocialMediaProvider(socialSource);
                    return await provider.searchPosts(keyword.replace(/^#/, ''), indicator, keyword.includes(' '));
                } catch {
                    return createPageable(EMPTY_LIST, createIndicator(undefined, pageParam));
                }
            },
        })),
        (data) => {
            const posts = compact(data.pages.flatMap((x) => x.data ?? []));
            return uniqBy(posts, (post) => post.postId);
        },
    );

    const listKey = `${ScrollListKey.Search}:${searchType}:${keywords.join(',')}:${source}:${orderType}`;

    if (queryResult.isPending && !queryResult.data) {
        return loading;
    }

    return (
        <ListInPage
            loginRequired={loginRequired}
            source={source}
            key={listKey}
            queryResult={queryResult}
            VirtualListProps={{
                listKey,
                computeItemKey: (index, post) => `${post.postId}-${orderType}-${index}`,
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
