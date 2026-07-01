'use client';

import { EMPTY_LIST } from '@dimensiondev/constants';
import { MIN_POST_SIZE_PER_THREAD } from '@dimensiondev/constants/static';
import type { SocialSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Suspense, useEffect, useState } from 'react';

import { getPostDetailQuery, getPostThreadQuery } from '@/app/[locale]/(normal)/post/[source]/[id]/(detail)/query.js';
import { PostActionsWithGrid } from '@/components/Actions/PostActionsWithGrid.js';
import { PostStatistics } from '@/components/Actions/PostStatistics.js';
import { QuickReply } from '@/components/Actions/QuickReply.js';
import { ChannelInfo } from '@/components/Channel/ChannelInfo.js';
import { CommentList } from '@/components/Comments/index.js';
import { ErrorBoundary } from '@/components/ErrorBoundary/index.js';
import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { PostDetailEffect } from '@/components/PostDetailEffect.js';
import { SinglePost } from '@/components/Posts/SinglePost.js';
import { ThreadBody } from '@/components/Posts/ThreadBody.js';
import { Section } from '@/components/Semantic/Section.js';
import { TweetUnavailableError } from '@/constants/error.js';
import { enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';

interface PostMediaSidebarProps {
    postId: string;
    source: SocialSource;
    onClose: () => void;
}

function PostMediaSidebarContent({
    postId,
    source,
    scrollContainer,
}: Omit<PostMediaSidebarProps, 'onClose'> & { scrollContainer: HTMLDivElement | null }) {
    const { data: post } = useSuspenseQuery(getPostDetailQuery(source, postId));
    const { data: threads } = useSuspenseQuery(getPostThreadQuery(source, postId, post));

    const isUnavailableTweet =
        post?.source === Source.Twitter && post.metadata.content?.content === TweetUnavailableError.message;

    useEffect(() => {
        if (isUnavailableTweet) {
            enqueueWarningMessage(TweetUnavailableError.message);
        }
    }, [isUnavailableTweet]);

    if (!post) return null;

    const allPosts = threads?.data || EMPTY_LIST;

    return (
        <article className="pb-20">
            {post.channel?.name ? (
                <Section title="Post Channel">
                    <ChannelInfo channel={post.channel} source={post.source} className="border-b border-line p-3" />
                </Section>
            ) : null}
            {allPosts.length >= MIN_POST_SIZE_PER_THREAD ? (
                <article className="px-4 py-3">
                    {allPosts.map((p, index) => (
                        <ThreadBody
                            isDetail
                            post={p}
                            disableAnimate
                            showTranslate
                            key={p.postId}
                            isLast={index === allPosts.length - 1}
                            hideAttachments={p.postId === post.postId}
                        />
                    ))}
                </article>
            ) : (
                <>
                    <SinglePost
                        post={post}
                        className="border-b-0"
                        disableAnimate
                        isDetail
                        showTranslate
                        hideAttachments
                    />

                    <Section title="Post Statistics And Actions">
                        <NoSSR>
                            <PostStatistics post={post} className="mb-1.5 px-3" />
                            {!post.isHidden ? (
                                <PostActionsWithGrid
                                    disablePadding
                                    post={post}
                                    isDetail
                                    disabled={post.isHidden}
                                    className="!mt-0 border-y border-line py-3 pl-2 pr-4"
                                />
                            ) : null}
                        </NoSSR>
                    </Section>
                    <Section title="Reply Post">
                        <NoSSR>
                            <QuickReply source={source} post={post} />
                        </NoSSR>
                    </Section>
                </>
            )}
            <Section title="Post Comments">
                <NoSSR>
                    <ErrorBoundary>
                        <Suspense fallback={<Loading />}>
                            <CommentList
                                postId={post.postId}
                                source={source}
                                excludePostIds={
                                    allPosts.length >= MIN_POST_SIZE_PER_THREAD ? allPosts.map((x) => x.postId) : []
                                }
                                customScrollParent={scrollContainer}
                            />
                        </Suspense>
                    </ErrorBoundary>
                </NoSSR>
            </Section>
            <PostDetailEffect post={post} />
        </article>
    );
}

export function PostMediaSidebar({ postId, source, onClose }: PostMediaSidebarProps) {
    const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
    const isDarkMode = useIsDarkMode();

    return (
        <div
            ref={setScrollEl}
            // The sidebar can render inside a Headless UI Dialog portal (when opened from the
            // timeline/detail page), which breaks the `.dark` ancestor chain that the `dark:`
            // variant and the CSS-variable colors rely on. Apply the `dark` class here so all
            // descendants resolve the correct theme regardless of where the portal mounts.
            className={classNames(
                'flex h-full w-[400px] shrink-0 flex-col overflow-y-auto border-l border-line text-left',
                isDarkMode ? 'dark bg-darkBottom' : 'bg-lightBottom',
            )}
            onClick={(e) => e.stopPropagation()}
        >
            <ErrorBoundary>
                <Suspense fallback={<Loading />}>
                    <PostMediaSidebarContent postId={postId} source={source} scrollContainer={scrollEl} />
                </Suspense>
            </ErrorBoundary>
        </div>
    );
}
