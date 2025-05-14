'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { ListInPage } from '@/components/ListInPage.js';
import { getPostItemContent } from '@/components/VirtualList/getPostItemContent.js';
import { ScrollListKey, SocialProfileCategory, Source } from '@/constants/enum.js';
import { createIndicator } from '@/helpers/pageable.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export function TrumpTruthSocialPosts() {
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['truth-social', 'posts'],

        queryFn: async ({ pageParam }) => {
            const posts = await FireflyEndpointProvider.getTrumpTruthSocialPosts(createIndicator(undefined, pageParam));
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
