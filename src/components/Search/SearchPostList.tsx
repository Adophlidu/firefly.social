import { Trans } from '@lingui/react/macro';
import { compact, isFunction, uniqBy } from 'lodash-es';
import { memo, type ReactNode } from 'react';

import { ListInPage } from '@/components/ListInPage.js';
import { Empty } from '@/components/Search/Empty.js';
import { getPostItemContent } from '@/components/VirtualList/getPostItemContent.js';
import { ScrollListKey, type SearchType, type SocialSource, Source } from '@/constants/enum.js';
import { EMPTY_LIST, REQUIRE_LOGIN_SOURCES_IN_SEARCH } from '@/constants/static.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { resolveSearchUrlType, SearchUrlKind } from '@/helpers/resolveSearchUrlType.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useMultiInfiniteQueryPageable } from '@/hooks/useMultiInfiniteQueryPageable.js';
import { logger } from '@/libs/Logger.js';
import { getPostByShortId } from '@/providers/firefly/farcaster-hub/getPostByShortId.js';
import { getPostById } from '@/services/getPostById.js';

interface Props {
    keyword: string | string[];
    source: Source;
    searchType: SearchType;
    emptyMessage?: ReactNode | ((keyword: string | string[]) => ReactNode);
    loading?: ReactNode;
    pageSize?: number;
}

export const SearchPostList = memo<Props>(function SearchPostList({
    keyword: searchKeyword,
    searchType,
    source,
    emptyMessage,
    loading,
    pageSize,
}) {
    const socialSource = narrowToSocialSource(source);
    const isLogin = useIsLogin(socialSource);
    const loginRequired = REQUIRE_LOGIN_SOURCES_IN_SEARCH.includes(socialSource);
    const keywordIsString = typeof searchKeyword === 'string';
    const invalidQuery = source === Source.Twitter && keywordIsString && (searchKeyword?.trim() || '').length < 2;
    const keywords = keywordIsString ? [searchKeyword] : searchKeyword;

    const queryResult = useMultiInfiniteQueryPageable(
        ['search', searchType, source, searchKeyword, isLogin],
        keywords.map((keyword) => ({
            key: keyword,
            queryFn: async ({ pageParam }) => {
                if (!keyword?.trim() || invalidQuery) {
                    return createPageable(EMPTY_LIST, createIndicator(undefined, pageParam));
                }

                // Check if this is a URL search
                // If the keyword is a URL and matches current source, extract identifier
                // Otherwise use the keyword as-is for search
                const urlResult = !pageParam ? resolveSearchUrlType(keyword) : null;
                const isUrlSearch =
                    urlResult?.kind === SearchUrlKind.Post &&
                    urlResult.source &&
                    urlResult.source === socialSource &&
                    urlResult.identifier;

                if (isUrlSearch && urlResult.identifier) {
                    try {
                        const post =
                            urlResult.source === Source.Farcaster && urlResult.secondaryId
                                ? await getPostByShortId(urlResult.identifier, urlResult.secondaryId)
                                : await getPostById(urlResult.source as SocialSource, urlResult.identifier);
                        return createPageable([post], createIndicator(undefined, pageParam));
                    } catch (error) {
                        logger.error('[Search] Failed to fetch post by URL', error);
                    }
                }

                if (loginRequired && !isLogin) {
                    return createPageable(EMPTY_LIST, createIndicator(undefined, pageParam));
                }

                // Use identifier if URL matches current source, otherwise use full keyword
                const searchKeyword = isUrlSearch && urlResult.identifier ? urlResult.identifier : keyword;

                try {
                    const indicator =
                        pageParam || source === Source.Lens
                            ? createIndicator(undefined, pageParam, pageSize)
                            : undefined;
                    const provider = resolveSocialMediaProvider(socialSource);
                    const result = await provider.searchPosts(
                        searchKeyword.replace(/^#/, ''),
                        searchKeyword.includes(' '),
                        indicator,
                    );

                    return result;
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

    const listKey = `${ScrollListKey.Search}:${searchType}:${keywords.join(',')}:${source}`;

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
                computeItemKey: (index, post) => `${post.postId}-${index}`,
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
