'use client';

import MessagesIcon from '@dimensiondev/assets/messages.svg';
import { EMPTY_LIST } from '@dimensiondev/constants';
import type { SocialSource } from '@dimensiondev/enums';
import { ScrollListKey, Source } from '@dimensiondev/enums';
import { createIndicator, createPageable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { memo, useMemo } from 'react';

import { CommentsFooter, type CommentsFooterProps } from '@/components/Comments/CommentsFooter.js';
import { HideComments } from '@/components/HideComments.js';
import { ListInPage } from '@/components/ListInPage.js';
import { OrbPostBodyFooter } from '@/components/Posts/OrbPostBodyFooter.js';
import { getPostItemContent } from '@/components/VirtualList/getPostItemContent.js';
import { resolveProviderOptions, resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { enrichPostWithFireflyArticle } from '@/services/getPostById.js';

interface CommentListProps {
    postId: string;
    source: SocialSource;
    excludePostIds?: string[];
    customScrollParent?: HTMLElement | null;
}

const CommentListComponents = {
    Footer: CommentsFooter,
};

export const CommentList = memo<CommentListProps>(function CommentList({
    postId,
    source,
    excludePostIds = EMPTY_LIST,
    customScrollParent,
}) {
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['posts', source, 'comments', postId],
        queryFn: async ({ pageParam }) => {
            if (!postId) return createPageable<Post>(EMPTY_LIST, createIndicator());

            const provider = resolveSocialMediaProvider(source, resolveProviderOptions(source, pageParam));
            const comments = await provider.getCommentsById(postId, createIndicator(undefined, pageParam));

            if (source === Source.Bsky) {
                const enrichedData = await Promise.all(comments.data.map(enrichPostWithFireflyArticle));
                return { ...comments, data: enrichedData };
            }

            return comments;
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select(data) {
            return data.pages.flatMap((x) => x.data).filter((x) => !excludePostIds.includes(x.postId));
        },
    });

    const context = useMemo(
        () => ({
            postId,
            source,
        }),
        [postId, source],
    );

    return (
        <>
            <ListInPage<Post, CommentsFooterProps['context']>
                source={source}
                key={source}
                queryResult={queryResult}
                VirtualListProps={{
                    listKey: `${ScrollListKey.Comment}:${postId}`,
                    computeItemKey: (index, post) => `${post.postId}-${index}`,
                    itemContent: (index, post) =>
                        getPostItemContent(index, post, `${ScrollListKey.Comment}:${postId}`, {
                            isComment: true,
                            bodyFooter: <OrbPostBodyFooter post={post} />,
                        }),
                    context,
                    components: CommentListComponents,
                    ...(customScrollParent ? { customScrollParent, useWindowScroll: false } : undefined),
                }}
                NoResultsFallbackProps={{
                    icon: <MessagesIcon width={24} height={24} />,
                    message: <Trans>Be the first one to comment!</Trans>,
                }}
            />
            {queryResult.data.length <= 0 ? (
                <HideComments
                    source={source}
                    excludePostIds={excludePostIds}
                    postId={postId}
                    className="border-t border-t-line"
                />
            ) : null}
        </>
    );
});
