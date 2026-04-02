'use client';

import LikeIcon from '@dimensiondev/assets/like.svg';
import LikedIcon from '@dimensiondev/assets/liked.svg';
import MirrorIcon from '@dimensiondev/assets/mirror.svg';
import { Trans } from '@lingui/react/macro';
import { first } from 'lodash-es';
import { memo } from 'react';

import { ClickableArea } from '@/components/ClickableArea.js';
import { Link } from '@/components/Link.js';
import { ThreadBody } from '@/components/Posts/ThreadBody.js';
import { ThreadBodyWithQuery } from '@/components/Posts/ThreadBodyWithQuery.js';
import { PageRoute, Source } from '@/constants/enum.js';
import { usePathname } from '@/esm/navigation.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { isSamePost } from '@/helpers/isSamePost.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { type Post } from '@/providers/types/SocialMedia.js';

export interface FeedActionType {
    post: Post;
    isThread?: boolean;
    listKey?: string;
    index?: number;
    isDetail?: boolean;
}

export const FeedActionType = memo<FeedActionType>(function FeedActionType({
    post,
    isThread,
    listKey,
    index,
    isDetail,
}) {
    const currentProfile = useCurrentProfile(post.source);

    const isComment = post.type === 'Comment';
    const showThread = isComment || !post.comments?.length;

    const pathname = usePathname();
    const isPostPage = isRoutePathname(pathname, PageRoute.PostDetail, true);

    if (post.isTruthSocial && post.retruthed) {
        return (
            <div className="mb-3 flex w-full items-center space-x-2 text-medium text-secondary">
                <MirrorIcon width={16} height={16} className="shrink-0" />
                <Link href={getProfileUrl(post.author)} className="flex min-w-0 space-x-1">
                    {isSameProfile(post.author, currentProfile) ? (
                        <Trans>
                            <strong className="mr-1">You</strong> retruthed
                        </Trans>
                    ) : (
                        <Trans>
                            <strong className="mr-1">{post.author.displayName}</strong> retruthed
                        </Trans>
                    )}
                </Link>
            </div>
        );
    }

    return (
        <ClickableArea className="w-full">
            {post.type === 'Mirror' && post.reporter && !isPostPage ? (
                <div className="mb-3 flex items-center space-x-2 text-medium text-secondary">
                    <MirrorIcon width={16} height={16} className="shrink-0" />
                    <Link href={getProfileUrl(post.reporter)} className="flex min-w-0 space-x-1">
                        {isSameProfile(post.reporter, currentProfile) ? (
                            <Trans>
                                <strong className="mr-1">You</strong> reposted
                            </Trans>
                        ) : (
                            <Trans>
                                <strong className="truncate">{post.reporter.displayName}</strong>{' '}
                                <span className="shrink-0">reposted</span>
                            </Trans>
                        )}
                    </Link>
                </div>
            ) : null}
            {post.mirrors?.length && !isPostPage ? (
                <div className="mb-3 flex items-center space-x-2 text-medium text-secondary">
                    <MirrorIcon width={16} height={16} />
                    <Link href={getProfileUrl(first(post.mirrors)!)}>
                        {post.mirrors.some((profile) => isSameProfile(profile, currentProfile)) ? (
                            post.source === Source.Farcaster ? (
                                post.mirrors.length < 2 ? (
                                    <Trans>
                                        <strong>You</strong> recasted
                                    </Trans>
                                ) : post.mirrors.length === 2 ? (
                                    <Trans>
                                        <strong>You</strong> and{' '}
                                        {
                                            post.mirrors.find((profile) => !isSameProfile(profile, currentProfile))
                                                ?.displayName
                                        }{' '}
                                        recasted
                                    </Trans>
                                ) : (
                                    <Trans>
                                        <strong>You</strong> and {post.mirrors.length - 1} others recasted
                                    </Trans>
                                )
                            ) : (
                                <Trans>
                                    <strong>You</strong> reposted
                                </Trans>
                            )
                        ) : post.source === Source.Farcaster ? (
                            <Trans>
                                <strong>{first(post.mirrors)?.displayName}</strong> recasted
                            </Trans>
                        ) : (
                            <Trans>
                                <strong>{first(post.mirrors)?.displayName}</strong> reposted
                            </Trans>
                        )}
                    </Link>
                </div>
            ) : null}
            {post.reactions?.length && !isComment && !isPostPage ? (
                <div className="mb-3 flex items-center space-x-2 text-medium text-secondary">
                    {post.hasLiked ? <LikedIcon width={17} height={16} /> : <LikeIcon width={17} height={16} />}
                    <Link href={getProfileUrl(first(post.reactions)!)}>
                        {post.reactions.some((profile) => isSameProfile(profile, currentProfile)) ? (
                            <Trans>
                                <strong>You</strong> liked
                            </Trans>
                        ) : (
                            <Trans>
                                <strong>{first(post.reactions)?.displayName}</strong> liked
                            </Trans>
                        )}
                    </Link>
                </div>
            ) : null}

            {showThread && !isThread && !post.mirrors?.length ? (
                <>
                    <PostRoot post={post} isDetail={isDetail} listKey={listKey} index={index} />
                    <PostParent post={post} isDetail={isDetail} listKey={listKey} index={index} />
                </>
            ) : null}
        </ClickableArea>
    );
});

interface PostParentProps {
    post: Post;
    isDetail?: boolean;
    listKey?: string;
    index?: number;
}

function PostRoot({ post, isDetail, listKey, index }: PostParentProps) {
    if (post.type !== 'Comment') return null;
    // avoid undefined === undefined
    if (
        (post.rootPostId && post.rootPostId === post.parentPostId) ||
        (post.root && post.commentOn && isSamePost(post.root, post.commentOn))
    )
        return null;
    if (post.root) {
        return <ThreadBody isDetail={isDetail} post={post.root} listKey={listKey} index={index} />;
    }
    if (post.commentLoadable && post.rootPostId) {
        return (
            <ThreadBodyWithQuery
                isDetail={isDetail}
                postId={post.rootPostId}
                source={post.source}
                listKey={listKey}
                index={index}
            />
        );
    }
    return null;
}

function PostParent({ post, isDetail, listKey, index }: PostParentProps) {
    if (post.type !== 'Comment') return null;
    if (post.commentOn) {
        return <ThreadBody isDetail={isDetail} post={post.commentOn} listKey={listKey} index={index} />;
    }
    if (post.commentLoadable && post.parentPostId) {
        return (
            <ThreadBodyWithQuery
                isDetail={isDetail}
                postId={post.parentPostId}
                source={post.source}
                listKey={listKey}
                index={index}
            />
        );
    }
    return null;
}
