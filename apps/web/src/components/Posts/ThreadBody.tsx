'use client';

import { classNames } from '@dimensiondev/utils';
import { motion } from 'framer-motion';
import { isUndefined } from 'lodash-es';
import { memo } from 'react';

import { PostActions, PostActionsWithGrid } from '@/components/Actions/index.js';
import { PostStatistics } from '@/components/Actions/PostStatistics.js';
import { NoSSR } from '@/components/NoSSR.js';
import { FeedActionType } from '@/components/Posts/ActionType.js';
import { PostBody } from '@/components/Posts/PostBody.js';
import { PostHeader } from '@/components/Posts/PostHeader.js';
import { queryClient } from '@/configs/queryClient.js';
import { PageRoute, Source } from '@/constants/enum.js';
import { usePathname, useRouter } from '@/esm/navigation.js';
import { getPostUrl } from '@/helpers/getPostUrl.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { useIsProfileMuted } from '@/hooks/useIsProfileMuted.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

export interface ThreadBodyProps {
    post: Post;
    disableAnimate?: boolean;
    isLast?: boolean;
    listKey?: string;
    index?: number;
    showTranslate?: boolean;
    isDetail?: boolean;
}

export const ThreadBody = memo<ThreadBodyProps>(function ThreadBody({
    post,
    disableAnimate,
    isLast = false,
    showTranslate = false,
    isDetail,
    listKey,
    index,
}) {
    const router = useRouter();
    const { setScrollIndex } = useGlobalState();

    const pathname = usePathname();
    const isDetailPage = isRoutePathname(pathname, PageRoute.PostDetail, true);
    const isFollowingPage = isRoutePathname(pathname, PageRoute.FollowingPosts, true);

    const link = getPostUrl(post);
    const muted = useIsProfileMuted(
        post.author.source,
        post.author.profileId,
        post.author.viewerContext?.blocking,
        // in following page, we already have post author blocking status on lens
        !isFollowingPage || post.source !== Source.Lens,
    );

    const showAction = !post.isHidden && !muted;

    const isSamePost = isDetailPage && link.includes(pathname);

    return (
        <motion.article
            initial={!disableAnimate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={classNames('bg-bottom', {
                'cursor-pointer': !isSamePost,
            })}
            onClick={() => {
                const selection = window.getSelection();
                if (selection && selection.toString().length !== 0) return;
                if (isSamePost) return;

                if (post.fireflyArticleUrl) {
                    queryClient.removeQueries({
                        queryKey: [post.source, 'post-detail', post.postId],
                    });
                }

                router.push(link);
            }}
        >
            <NoSSR mode="mounted">
                <FeedActionType isDetail={isDetail} post={post} isThread />
            </NoSSR>
            <PostHeader
                showDate={!!isDetail && !isLast}
                post={post}
                onClickProfileLink={() => {
                    if (listKey && !isUndefined(index)) setScrollIndex(listKey, index);
                }}
            />
            <div className="flex">
                {isDetail && isLast ? null : (
                    <div
                        className={classNames('ml-5 mr-8 border-[0.8px]', {
                            'border-transparent bg-transparent dark:border-transparent dark:bg-none': isLast,
                            'border-gray-300 bg-gray-300 dark:border-gray-700 dark:bg-gray-700': !isLast,
                        })}
                    />
                )}

                <div
                    className={classNames('w-full min-w-0 max-w-[calc(100%_-_53px)]', {
                        'pb-5': !isLast,
                        'md:-mt-[14px]': !isDetailPage || !isLast,
                    })}
                >
                    <PostBody
                        post={post}
                        disablePadding
                        showTranslate={showTranslate}
                        isDetail={isDetail}
                        fireflyArticleToggle={!!isDetail && !isLast && !isSamePost}
                    />
                    <NoSSR mode="mounted">
                        {showAction ? (
                            isDetail && isLast ? null : (
                                <PostActions
                                    hideDate={!!isDetail && !isLast}
                                    post={post}
                                    disabled={post.isHidden}
                                    disablePadding
                                    onSetScrollIndex={() => {
                                        if (listKey && !isUndefined(index)) setScrollIndex(listKey, index);
                                    }}
                                />
                            )
                        ) : null}
                    </NoSSR>
                </div>
            </div>
            <NoSSR mode="mounted">
                {showAction && isDetail && isLast ? (
                    <div className="-mx-4">
                        <PostStatistics post={post} className="mb-1.5 px-4" />
                        <PostActionsWithGrid
                            isDetail={isDetail}
                            disablePadding
                            post={post}
                            disabled={post.isHidden}
                            className="border-line !mt-0 border-y py-3 pl-2.5 pr-4"
                        />
                    </div>
                ) : null}
            </NoSSR>
        </motion.article>
    );
});
