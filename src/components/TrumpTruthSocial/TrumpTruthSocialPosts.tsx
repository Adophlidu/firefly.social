'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { ListInPage } from '@/components/ListInPage.js';
import { getPostItemContent } from '@/components/VirtualList/getPostItemContent.js';
import { ExploreSwitchType, ScrollListKey, SocialProfileCategory, Source } from '@/constants/enum.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { useExploreDataSwitchConfig } from '@/hooks/useExploreDataSwitchConfig.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export function TrumpTruthSocialPosts() {
    const { status } = useExploreDataSwitchConfig(ExploreSwitchType.TruthSocial);
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['truth-social', 'posts', status],

        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            if (!status) return createPageable([], indicator);

            const posts = await FireflyEndpointProvider.getTrumpTruthSocialPosts(indicator);
            return posts;
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length === 0) return;
            return lastPage?.nextIndicator?.id;
        },
        select: (data) => data.pages.flatMap((x) => x?.data || []),
    });

    return (
        <ListInPage
            source={Source.Twitter}
            key={SocialProfileCategory.TruthSocial}
            queryResult={queryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.Profile}:${SocialProfileCategory.TruthSocial}`,
                computeItemKey: (index, post) => `${post.publicationId}-${post.postId}-${index}`,
                itemContent: (index, post) =>
                    getPostItemContent(index, post, `${ScrollListKey.Profile}:${SocialProfileCategory.TruthSocial}`, {
                        showMore: false,
                    }),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
