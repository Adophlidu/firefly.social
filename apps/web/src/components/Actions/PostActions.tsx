'use client';

import { ENABLED_BOOKMARK_SOURCES } from '@dimensiondev/constants/computed';
import { PostType, Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
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
import { resolveFireflyProfileId } from '@/helpers/resolveFireflyProfileId.js';
import { useIsPostDetailPage } from '@/hooks/post/useIsPostDetailPage.js';
import { useFireflyIdentity } from '@/hooks/useFireflyIdentity.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import type { Post } from '@/providers/types/SocialMedia.js';

/** Drop selected actions from the PostActions row (used by the Orb comment cell). */
export interface PostActionsMask {
    mirror?: boolean;
    collect?: boolean;
    bookmark?: boolean;
    comment?: boolean;
    /** Hide the PostStatistics row (comment/like counts + channel tag). */
    statistics?: boolean;
}

interface PostActionsProps extends HTMLProps<HTMLDivElement> {
    showChannelTag?: boolean;
    post: Post;
    disablePadding?: boolean;
    hideDate?: boolean;
    onSetScrollIndex?: () => void;
    actionsMask?: PostActionsMask;
    /** Show the Like count (default hides it). */
    showLikeCount?: boolean;
}

export const PostActions = memo<PostActionsProps>(function PostActions({
    post,
    className,
    disabled = false,
    disablePadding = false,
    showChannelTag,
    hideDate,
    onSetScrollIndex,
    actionsMask,
    showLikeCount = false,
    ...rest
}) {
    const isMedium = useIsMedium('max');
    const isComment = post.type === PostType.Comment;
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
                    {actionsMask?.comment ? null : <Comment post={post} hiddenCount disabled={disabled} />}
                    {actionsMask?.mirror ? null : (
                        <Mirror
                            disabled={disabled}
                            shares={(post.stats?.mirrors || 0) + (post.stats?.quotes || 0)}
                            source={post.source}
                            postId={post.postId}
                            post={post}
                        />
                    )}
                    <Like isComment={isComment} post={post} disabled={disabled} hiddenCount={!showLikeCount} />
                </div>
                <div className="flex translate-x-1.5 items-center space-x-2">
                    {post.source !== Source.Farcaster && post.canAct && !actionsMask?.collect ? (
                        <Collect
                            post={post}
                            count={post.stats?.countOpenActions}
                            disabled={disabled}
                            collected={post.hasActed}
                            hiddenCount
                        />
                    ) : null}
                    {ENABLED_BOOKMARK_SOURCES.includes(post.source) && !actionsMask?.bookmark ? (
                        <PostBookmark post={post} disabled={disabled} />
                    ) : null}
                    {identity.id ? (
                        <Tips post={post} identity={identity} disabled={disabled} handle={post.author.handle} />
                    ) : null}
                    <Share key="share" disabled={disabled} post={post} />
                </div>
            </ClickableArea>
            {!actionsMask?.statistics ? (
                <PostStatistics
                    hideDate={hideDate}
                    hideSource={hideDate}
                    isComment={isComment}
                    post={post}
                    showChannelTag={showChannelTag}
                    onSetScrollIndex={onSetScrollIndex}
                />
            ) : null}
        </footer>
    );
});
