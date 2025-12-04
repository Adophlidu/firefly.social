import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { ListInPage } from '@/components/ListInPage.js';
import { getPostItemContent } from '@/components/VirtualList/getPostItemContent.js';
import { ScrollListKey, SocialProfileCategory, type SocialSource } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { getPostsSelector } from '@/helpers/getPostsSelector.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface RepliesListProps {
    profileId: string;
    source: SocialSource;
}

export function RepliesList({ profileId, source }: RepliesListProps) {
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['posts', source, 'replies-of', profileId],

        queryFn: async ({ pageParam }) => {
            if (!profileId) return createPageable<Post>(EMPTY_LIST, createIndicator());

            const provider = resolveSocialMediaProvider(source);
            const posts = await provider.getRepliesPostsByProfileId(profileId, createIndicator(undefined, pageParam));

            return posts;
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => {
            if (!lastPage?.data.length) return;
            return lastPage.nextIndicator?.id;
        },
        select: getPostsSelector(source),
    });

    return (
        <ListInPage
            source={source}
            key={source}
            queryResult={queryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.Profile}:${SocialProfileCategory.Replies}:${profileId}`,
                computeItemKey: (index, post) => `${post.postId}-${index}`,
                itemContent: (index, post) => getPostItemContent(index, post),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
