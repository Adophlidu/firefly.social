import { EngagementType, ScrollListKey } from '@dimensiondev/enums';
import { createIndicator, NotFoundError } from '@dimensiondev/utils';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { notFound } from 'next/navigation.js';

import type { PostEngagementListProps } from '@/components/Engagement/type.js';
import { ListInPage } from '@/components/ListInPage.js';
import { SinglePost } from '@/components/Posts/SinglePost.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import type { Post } from '@/providers/types/SocialMedia.js';

function getPostContent(index: number, post: Post) {
    return <SinglePost key={post.publicationId} post={post} index={index} keepMutedSpace />;
}

export function QuoteList({ postId, type, source }: PostEngagementListProps) {
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: [type === EngagementType.Quotes ? 'posts' : 'profiles', source, 'engagements', type, postId],
        queryFn: async ({ pageParam }) => {
            try {
                const provider = resolveSocialMediaProvider(source);
                return await provider.getPostsQuoteOn(postId, createIndicator(undefined, pageParam));
            } catch (error) {
                if (error instanceof NotFoundError) {
                    notFound();
                }
                throw error;
            }
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length === 0) return;
            return lastPage?.nextIndicator?.id;
        },
        select(data) {
            return data.pages.flatMap((x) => x.data);
        },
    });
    const listKey = `${ScrollListKey.Engagement}:${postId}:${type}`;
    return (
        <ListInPage
            source={source}
            key={type}
            queryResult={queryResult}
            VirtualListProps={{
                listKey,
                computeItemKey: (index, post) => `${post.postId}-${index}`,
                itemContent: getPostContent,
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
