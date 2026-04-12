'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import { isUndefined } from 'lodash-es';
import { type HTMLProps, memo, type ReactNode, useMemo } from 'react';

import { PostActions } from '@/components/Actions/index.js';
import { useDisableScrollRestore } from '@/components/DisableScrollRestore/index.js';
import { NoSSR } from '@/components/NoSSR.js';
import { FeedActionType } from '@/components/Posts/ActionType.js';
import { PostBody } from '@/components/Posts/PostBody.js';
import { PostHeader } from '@/components/Posts/PostHeader.js';
import { queryClient } from '@/configs/queryClient.js';
import { PageRoute, Source } from '@/constants/enum.js';
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

    if (!isProfilePage && !isDetail && muted)
        return keepMutedSpace ? <div className="pointer-events-none -mt-px h-px" /> : null;

    const showPostAction = !isDetail && (isProfilePage || !post.isHidden || !muted);

    return (
        <motion.article
            initial={!disableAnimate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={classNames(
                'border-line cursor-pointer border-b bg-bottom px-3 py-2 md:px-4 md:py-3',
                className,
                {
                    'hover:bg-bg': !isDetail,
                },
            )}
            onClick={() => {
                const selection = window.getSelection();
                if (selection && selection.toString().length !== 0) return;
                if (post.isTruthSocial) {
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
                    router.push(postLink);
                }
                return;
            }}
        >
            {header}
            <NoSSR>
                {!isComment ? <FeedActionType isDetail={isDetail} post={post} listKey={listKey} index={index} /> : null}
            </NoSSR>

            <PostHeader
                isComment={isComment}
                post={post}
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
                fireflyArticleToggle={!!isPostPage && !postLink.includes(pathname)}
                listKey={listKey}
                index={index}
            />
            <NoSSR>
                {showPostAction && !post.isTruthSocial ? (
                    <PostActions
                        post={post}
                        disabled={!isBookmarkPage && post.isHidden}
                        showChannelTag={!isComment && !isChannelPage && showChannelTag}
                        onSetScrollIndex={() => {
                            if (listKey && !isUndefined(index)) setScrollIndex(listKey, index);
                        }}
                    />
                ) : null}
            </NoSSR>

            {show ? (
                <div className="text-medium text-highlight mt-2 w-full cursor-pointer text-center font-bold">
                    <div>
                        <Trans>Show More</Trans>
                    </div>
                </div>
            ) : null}
        </motion.article>
    );
});
