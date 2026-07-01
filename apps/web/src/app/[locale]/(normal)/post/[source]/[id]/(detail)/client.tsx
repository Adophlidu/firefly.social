'use client';

import { EMPTY_LIST } from '@dimensiondev/constants';
import { MIN_POST_SIZE_PER_THREAD } from '@dimensiondev/constants/static';
import type { SocialSource } from '@dimensiondev/enums';
import { SearchType, Source } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';
import { last } from 'lodash-es';
import { Suspense, useEffect, useRef, useState } from 'react';

import { getPostDetailQuery, getPostThreadQuery } from '@/app/[locale]/(normal)/post/[source]/[id]/(detail)/query.js';
import { PostActionsWithGrid } from '@/components/Actions/PostActionsWithGrid.js';
import { PostStatistics } from '@/components/Actions/PostStatistics.js';
import { QuickReply } from '@/components/Actions/QuickReply.js';
import { ChannelInfo } from '@/components/Channel/ChannelInfo.js';
import { CommentList } from '@/components/Comments/index.js';
import { ErrorBoundary } from '@/components/ErrorBoundary/index.js';
import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { NotFound } from '@/components/NotFound.js';
import { PostDetailEffect } from '@/components/PostDetailEffect.js';
import { SinglePost } from '@/components/Posts/SinglePost.js';
import { ThreadBody } from '@/components/Posts/ThreadBody.js';
import { Section } from '@/components/Semantic/Section.js';
import { queryClient } from '@/configs/queryClient.js';
import { TweetUnavailableError } from '@/constants/error.js';
import { notFound, useSearchParams } from '@/esm/navigation.js';
import { enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { useFixedScrollInToViewBeforeUserInteraction } from '@/hooks/useFixedScrollInToViewBeforeUserInteraction.js';
import { getPostById } from '@/services/getPostById.js';

interface Props {
    id: string;
    source: SocialSource;
}

export function PageDetail({ id: postId, source }: Props) {
    if (!postId) notFound();

    const pinMore = useSearchParams().get('more');

    const { data: post } = useSuspenseQuery(getPostDetailQuery(source, postId));
    const { data: threads } = useSuspenseQuery(getPostThreadQuery(source, postId, post));
    const [threadsRef, setThreadsRef] = useState<Record<string, HTMLElement | null>>({});

    const isUnavailableTweet =
        post?.source === Source.Twitter && post.metadata.content?.content === TweetUnavailableError.message;

    useEffect(() => {
        if (isUnavailableTweet) {
            enqueueWarningMessage(TweetUnavailableError.message);
        }
    }, [isUnavailableTweet]);

    // X media is only resolvable with the user's session, so a server-rendered (hydrated) tweet
    // can arrive without attachments. Re-fetch once on the client and patch the cache only when the
    // authenticated response actually carries media, so the detail page doesn't render text-only.
    const postHasMedia = !!(post?.metadata.content?.attachments?.length || post?.metadata.content?.asset);
    const revalidatedMediaRef = useRef(false);
    useEffect(() => {
        if (post?.source !== Source.Twitter || postHasMedia || isUnavailableTweet) return;
        if (revalidatedMediaRef.current) return;
        revalidatedMediaRef.current = true;

        getPostById(source, postId)
            .then((fresh) => {
                const freshHasMedia = !!(
                    fresh?.metadata.content?.attachments?.length || fresh?.metadata.content?.asset
                );
                if (freshHasMedia) queryClient.setQueryData(getPostDetailQuery(source, postId).queryKey, fresh);
            })
            .catch(() => {});
    }, [post?.source, postHasMedia, isUnavailableTweet, source, postId]);

    const lastThread = last(threads?.data)?.postId;
    useFixedScrollInToViewBeforeUserInteraction(
        !(pinMore && !lastThread),
        pinMore ? threadsRef[lastThread || ''] : threadsRef[postId],
    );

    // Check for null after queries - useSuspenseQuery handles loading states
    if (!post) notFound();

    if (isUnavailableTweet) {
        return (
            <NotFound
                text={<Trans>Post could not be found.</Trans>}
                search={{ text: <Trans>Search post</Trans>, searchText: '', searchType: SearchType.Posts }}
            />
        );
    }

    const allPosts = threads?.data || EMPTY_LIST;

    return (
        <article className="min-h-svh pb-20 md:pb-0">
            {post.channel?.name ? (
                <Section title="Post Channel">
                    <ChannelInfo channel={post.channel} source={post.source} className="border-b border-line p-3" />
                </Section>
            ) : null}
            {allPosts.length >= MIN_POST_SIZE_PER_THREAD ? (
                <article className="px-4 py-3">
                    {allPosts.map((post, index) => {
                        return (
                            <ThreadBody
                                isDetail
                                post={post}
                                disableAnimate
                                showTranslate
                                key={post.postId}
                                isLast={index === allPosts.length - 1}
                                ref={(ref) => {
                                    setThreadsRef((prev) => ({ ...prev, [post.postId]: ref }));
                                }}
                            />
                        );
                    })}
                </article>
            ) : (
                <>
                    <SinglePost post={post} className="border-b-0" disableAnimate isDetail showTranslate />

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
                        <Suspense
                            fallback={
                                <div className="min-h-lvh">
                                    <Loading />
                                </div>
                            }
                        >
                            <CommentList
                                postId={post.postId}
                                source={source}
                                excludePostIds={
                                    allPosts.length >= MIN_POST_SIZE_PER_THREAD ? allPosts.map((x) => x.postId) : []
                                }
                            />
                        </Suspense>
                    </ErrorBoundary>
                </NoSSR>
            </Section>
            <PostDetailEffect post={post} />
        </article>
    );
}
