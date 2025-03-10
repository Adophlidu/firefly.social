'use client';

import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';

import { ListInPage } from '@/components/ListInPage.js';
import { Empty } from '@/components/Search/Empty.js';
import { SearchSources } from '@/components/Search/SearchSources.js';
import { getPostItemContent } from '@/components/VirtualList/getPostItemContent.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { REQUIRE_LOGIN_SOURCES_IN_SEARCH } from '@/constants/index.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { createIndicator } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';

export function SearchPostContent() {
    const { searchKeyword, searchType, source } = useSearchStateStore();
    const currentSocialSource = narrowToSocialSource(source);
    const isLogin = useIsLogin(currentSocialSource);
    const loginRequired = REQUIRE_LOGIN_SOURCES_IN_SEARCH.includes(currentSocialSource);
    const invalidQuery = source === Source.Twitter && (searchKeyword?.trim() || '').length < 2;

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['search', searchType, searchKeyword, source, isLogin],
        queryFn: async ({ pageParam }) => {
            if (!searchKeyword?.trim() || invalidQuery || (loginRequired && !isLogin)) return;
            const provider = resolveSocialMediaProvider(currentSocialSource);
            const indicator = pageParam ? createIndicator(undefined, pageParam) : undefined;

            return provider.searchPosts(searchKeyword.replace(/^#/, ''), indicator);
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length === 0) return;
            return lastPage?.nextIndicator?.id;
        },
        select(data) {
            return compact(data.pages.flatMap((x) => x?.data ?? []));
        },
    });

    const listKey = `${ScrollListKey.Search}:${searchType}:${searchKeyword}:${source}`;

    return (
        <>
            <SearchSources source={source} query={searchKeyword} searchType={searchType} />
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
                    message: (
                        <Empty
                            keyword={searchKeyword}
                            message={invalidQuery ? <Trans>Please enter at least 2 characters.</Trans> : undefined}
                        />
                    ),
                }}
            />
        </>
    );
}
