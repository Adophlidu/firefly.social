'use client';

import { PageRoute, Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import { isUndefined } from 'lodash-es';
import { type HTMLProps, memo, type ReactNode, useMemo, useRef } from 'react';
import urlcat from 'urlcat';
import { useHover } from 'usehooks-ts';

import { PostActions, type PostActionsMask } from '@/components/Actions/PostActions.js';
import { useDisableScrollRestore } from '@/components/DisableScrollRestore/index.js';
import { NoSSR } from '@/components/NoSSR.js';
import { FeedActionType } from '@/components/Posts/ActionType.js';
import { PostBody } from '@/components/Posts/PostBody.js';
import { PostHeader } from '@/components/Posts/PostHeader.js';
import { ShareButtonWithAnimationContext } from '@/components/Posts/ShareButton.js';
import { queryClient } from '@/configs/queryClient.js';
import { usePathname, useRouter } from '@/esm/navigation.js';
import { isFireflyPostUrl } from '@/helpers/fireflyPostUrl.js';
import { getPostUrl } from '@/helpers/getPostUrl.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { matchUrls } from '@/helpers/matchUrls.js';
import { openWindow } from '@/helpers/openWindow.js';
import { useIsProfileMuted } from '@/hooks/useIsProfileMuted.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

export interface SinglePostProps extends HTMLProps<HTMLDivElement> {
    post: Post;
    disableAnimate?: boolean;
    showMore?: boolean;
    isComment?: boolean;
    isDetail?: boolean;
    listKey?: string;
    index?: number;
    showTranslate?: boolean;
    showChannelTag?: boolean;
    header?: ReactNode;
    keepMutedSpace?: boolean;
    hideAttachments?: boolean;
    /** Orb-comment cell flags — forwarded to PostHeader / PostActions. */
    hideHeaderHandle?: boolean;
    hideMoreMenu?: boolean;
    hideNonFireflySourceIcon?: boolean;
    actionsMask?: PostActionsMask;
    showLikeCount?: boolean;
}
export const SinglePost = memo<SinglePostProps>(function SinglePost({
    post,
    disableAnimate = false,
    showMore = false,
    isComment = false,
    isDetail = false,
    showTranslate = false,
    showChannelTag = true,
    listKey,
    index,
    className,
    header,
    keepMutedSpace,
    hideAttachments,
    hideHeaderHandle,
    hideMoreMenu,
    hideNonFireflySourceIcon,
    actionsMask,
    showLikeCount,
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { setScrollIndex } = useGlobalState();

    const isPostPage = isRoutePathname(pathname, '/post/:source');
    const isProfilePage = isRoutePathname(pathname, '/profile/:source');
    const isChannelPage = isRoutePathname(pathname, '/club/:detail');
    const isBookmarkPage = isRoutePathname(pathname, PageRoute.Bookmarks);
    const isFollowingPage = isRoutePathname(pathname, PageRoute.FollowingPosts, true);
    const isEngagementPage = isRoutePathname(pathname, '/post/:source/:id/:type');
    const postLink = getPostUrl(post);
    const muted =
        useIsProfileMuted(
            post.author.source,
            post.author.profileId,
            post.author.viewerContext?.blocking,
            // in following page, we already have post author blocking status on lens
            !isFollowingPage || post.source !== Source.Lens,
        ) ||
        (!!post.channel?.blocked && !isChannelPage);

    const show = useMemo(() => {
        if (post.source === Source.Twitter) return false;
        if (!post.isThread || isPostPage) return false;
        if (post.source === Source.Farcaster && post.stats?.comments === 0) return false;
        return true;
    }, [post, isPostPage]);
    const disableScrollRestore = useDisableScrollRestore();

    const ref = useRef<HTMLElement>(null!);
    const hover = useHover(ref);

    if (!isProfilePage && !isDetail && muted)
        return keepMutedSpace ? <div className="pointer-events-none -mt-px h-px" /> : null;

    const showPostAction = !isDetail && (isProfilePage || !post.isHidden || !muted);
    const href = post.isTruthSocial ? post.permalink : postLink;
    const onClick: (fromMore: boolean) => React.MouseEventHandler<HTMLElement> = (fromMore) => (event) => {
        const selection = window.getSelection();
        if (selection && selection.toString().length !== 0) return;
        if (post.isTruthSocial) {
            event.preventDefault();
            event.stopPropagation();
            openWindow(post.permalink || '', '_blank');
            return;
        }

        if (!isPostPage || isComment || isEngagementPage) {
            // Clear cache before navigation to ensure fresh data in detail page
            if (isComment && post.source === Source.Bsky) {
                // For Bsky comments, clear cache to get full content
                queryClient.removeQueries({
                    queryKey: [post.source, 'post-detail', post.postId],
                });
            } else if (post.source === Source.Bsky && post.metadata.content?.content) {
                // Clear cache for Bsky long posts before navigation
                const urls = matchUrls(post.metadata.content.content);
                if (urls.some(isFireflyPostUrl)) {
                    queryClient.removeQueries({
                        queryKey: [post.source, 'post-detail', post.postId],
                    });
                }
            }

            if (listKey && !isUndefined(index) && !disableScrollRestore) setScrollIndex(listKey, index);
            router.push(fromMore ? urlcat(postLink, { more: true }) : postLink);
            event.preventDefault();
            event.stopPropagation();
        }
        return;
    };

    return (
        <motion.article
            ref={ref}
            initial={!disableAnimate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={classNames(
                'cursor-pointer border-b border-line bg-bottom px-3 py-2 md:px-4 md:py-3',
                className,
                {
                    'hover:bg-bg': !isDetail,
                },
            )}
            onClick={onClick(false)}
            data-href={href}
        >
            <ShareButtonWithAnimationContext.Provider value={hover}>
                {header}
                <NoSSR mode="mounted">
                    {!isComment ? (
                        <FeedActionType isDetail={isDetail} post={post} listKey={listKey} index={index} />
                    ) : null}
                </NoSSR>

                <PostHeader
                    isComment={isComment}
                    post={post}
                    hideHeaderHandle={hideHeaderHandle}
                    hideMoreMenu={hideMoreMenu}
                    hideNonFireflySourceIcon={hideNonFireflySourceIcon}
                    onClickProfileLink={() => {
                        if (listKey && !isUndefined(index)) setScrollIndex(listKey, index);
                    }}
                />

                <PostBody
                    post={post}
                    showMore={showMore}
                    showTranslate={showTranslate}
                    isDetail={isDetail}
                    isComment={isComment}
                    hideAttachments={hideAttachments}
                    fireflyArticleToggle={!!isPostPage && !postLink.includes(pathname)}
                    listKey={listKey}
                    index={index}
                />
                <NoSSR mode="mounted">
                    {showPostAction && !post.isTruthSocial ? (
                        <PostActions
                            post={post}
                            disabled={!isBookmarkPage && post.isHidden}
                            showChannelTag={!isComment && !isChannelPage && showChannelTag}
                            actionsMask={actionsMask}
                            showLikeCount={showLikeCount}
                            onSetScrollIndex={() => {
                                if (listKey && !isUndefined(index)) setScrollIndex(listKey, index);
                            }}
                        />
                    ) : null}
                </NoSSR>

                {show ? (
                    <div
                        onClick={onClick(true)}
                        className="mt-2 w-full cursor-pointer text-center text-medium font-bold text-highlight"
                    >
                        <div>
                            <Trans>Show More</Trans>
                        </div>
                    </div>
                ) : null}
            </ShareButtonWithAnimationContext.Provider>
        </motion.article>
    );
});
