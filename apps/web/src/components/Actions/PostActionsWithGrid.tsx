'use client';

import { ENABLED_BOOKMARK_SOURCES } from '@dimensiondev/constants/computed';
import { PostType, Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { compact } from 'lodash-es';
import { type HTMLProps, memo } from 'react';

import { Collect } from '@/components/Actions/Collect.js';
import { Comment } from '@/components/Actions/Comment.js';
import { Like } from '@/components/Actions/Like.js';
import { Mirror } from '@/components/Actions/Mirror.js';
import { PostBookmark } from '@/components/Actions/PostBookmark.js';
import { Share } from '@/components/Actions/Share.js';
import { ClickableArea } from '@/components/ClickableArea.js';
import { Tips } from '@/components/Tips/index.js';
import { resolveFireflyProfileId } from '@/helpers/resolveFireflyProfileId.js';
import { useDetailPostForActions } from '@/hooks/useDetailPostForActions.js';
import { useFireflyIdentity } from '@/hooks/useFireflyIdentity.js';
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
    const { data: post = initialPost } = useDetailPostForActions(initialPost, isDetail);

    const isComment = post.type === PostType.Comment;
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
