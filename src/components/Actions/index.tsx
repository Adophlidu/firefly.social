'use client';

import { classNames, NotFoundError } from '@dimensiondev/utils';
import { useQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';
import { type HTMLProps, memo } from 'react';

import { Collect } from '@/components/Actions/Collect.js';
import { Comment } from '@/components/Actions/Comment.js';
import { Like } from '@/components/Actions/Like.js';
import { Mirror } from '@/components/Actions/Mirror.js';
import { PostBookmark } from '@/components/Actions/PostBookmark.js';
import { PostStatistics } from '@/components/Actions/PostStatistics.js';
import { Share } from '@/components/Actions/Share.js';
import { ClickableArea } from '@/components/ClickableArea.js';
import { Tips } from '@/components/Tips/index.js';
import { ENABLED_BOOKMARK_SOURCES } from '@/constants/computed.js';
import { Source } from '@/constants/enum.js';
import { resolveFireflyProfileId } from '@/helpers/resolveFireflyProfileId.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useIsPostDetailPage } from '@/hooks/post/useIsPostDetailPage.js';
import { useAsyncStatus } from '@/hooks/useAsyncStatus.js';
import { useFireflyIdentity } from '@/hooks/useFireflyIdentity.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface PostActionsWithGridProps extends HTMLProps<HTMLDivElement> {
    disablePadding?: boolean;
    post: Post;
    isDetail?: boolean;
}

export const PostActionsWithGrid = memo<PostActionsWithGridProps>(function PostActionsWithGrid({
    className,
    post: initialPost,
    isDetail = false,
    disabled = false,
    disablePadding = false,
}) {
    const asyncStatus = useAsyncStatus(initialPost.source);
    const postId = initialPost.postId;

    const { data: post = initialPost } = useQuery({
        queryKey: [initialPost.source, 'post-detail', 'actions', initialPost.postId, asyncStatus],
        queryFn: async () => {
            if (!postId) return;

            try {
                const provider = resolveSocialMediaProvider(initialPost.source);
                const post = await provider.getPostById(postId);
                if (!post) return;
                return post;
            } catch (error) {
                if (error instanceof NotFoundError) return;
                throw error;
            }
        },
        enabled: isDetail,
    });

    const isComment = post.type === 'Comment';
    const identity = useFireflyIdentity(post.source, resolveFireflyProfileId(post.author) ?? '');
    const actions = compact([
        <div key="comment">
            <Comment post={post} hiddenCount disabled={disabled} />
        </div>,
        <div key="mirror">
            <Mirror
                disabled={disabled}
                shares={(post.stats?.mirrors || 0) + (post.stats?.quotes || 0)}
                source={post.source}
                postId={post.postId}
                post={post}
            />
        </div>,

        post.source !== Source.Farcaster && post.canAct ? (
            <div key="collect">
                <Collect
                    count={post.stats?.countOpenActions}
                    disabled={disabled}
                    collected={post.hasActed}
                    hiddenCount
                    post={post}
                />
            </div>
        ) : null,
        <div key="like">
            <Like isComment={isComment} post={post} disabled={disabled} hiddenCount />
        </div>,
        identity.id ? (
            <Tips key="tips" post={post} identity={identity} disabled={disabled} handle={post.author.handle} />
        ) : null,
        ENABLED_BOOKMARK_SOURCES.includes(post.source) ? (
            <PostBookmark key="bookmark" post={post} disabled={disabled} />
        ) : null,
        <Share key="share" className="!flex-none" post={post} disabled={disabled} />,
    ]);

    return (
        <ClickableArea
            className={classNames('mt-2 flex items-center justify-between text-second', className, {
                'pl-[52px]': !disablePadding,
            })}
        >
            {actions}
        </ClickableArea>
    );
});

interface PostActionsProps extends HTMLProps<HTMLDivElement> {
    showChannelTag?: boolean;
    post: Post;
    disablePadding?: boolean;
    hideDate?: boolean;
    onSetScrollIndex?: () => void;
}

export const PostActions = memo<PostActionsProps>(function PostActions({
    post,
    className,
    disabled = false,
    disablePadding = false,
    showChannelTag,
    hideDate,
    onSetScrollIndex,
    ...rest
}) {
    const isMedium = useIsMedium('max');
    const isComment = post.type === 'Comment';
    const isDetailPage = useIsPostDetailPage();

    const identity = useFireflyIdentity(post.source, resolveFireflyProfileId(post.author) ?? '');

    const noLeftPadding = isDetailPage || isMedium || disablePadding;

    return (
        <footer
            className={classNames('mt-2 text-xs text-second', className, {
                'pl-[52px]': !noLeftPadding,
            })}
            {...rest}
        >
            <ClickableArea className="flex justify-between">
                <div className="flex -translate-x-1.5 items-center space-x-2">
                    <Comment post={post} hiddenCount disabled={disabled} />
                    <Mirror
                        disabled={disabled}
                        shares={(post.stats?.mirrors || 0) + (post.stats?.quotes || 0)}
                        source={post.source}
                        postId={post.postId}
                        post={post}
                    />
                    <Like isComment={isComment} post={post} disabled={disabled} hiddenCount />
                </div>
                <div className="flex translate-x-1.5 items-center space-x-2">
                    {post.source !== Source.Farcaster && post.canAct ? (
                        <Collect
                            post={post}
                            count={post.stats?.countOpenActions}
                            disabled={disabled}
                            collected={post.hasActed}
                            hiddenCount
                        />
                    ) : null}
                    {ENABLED_BOOKMARK_SOURCES.includes(post.source) ? (
                        <PostBookmark post={post} disabled={disabled} />
                    ) : null}
                    {identity.id ? (
                        <Tips post={post} identity={identity} disabled={disabled} handle={post.author.handle} />
                    ) : null}
                    <Share key="share" disabled={disabled} post={post} />
                </div>
            </ClickableArea>
            <PostStatistics
                hideDate={hideDate}
                hideSource={hideDate}
                isComment={isComment}
                post={post}
                showChannelTag={showChannelTag}
                onSetScrollIndex={onSetScrollIndex}
            />
        </footer>
    );
});
