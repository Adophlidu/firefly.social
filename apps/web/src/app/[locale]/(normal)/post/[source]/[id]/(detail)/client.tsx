'use client';

import { EMPTY_LIST } from '@dimensiondev/constants';
import { MIN_POST_SIZE_PER_THREAD } from '@dimensiondev/constants/static';
import type { SocialSource } from '@dimensiondev/enums';
import { SearchType, Source } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Suspense, useEffect } from 'react';

import { getPostDetailQuery, getPostThreadQuery } from '@/app/[locale]/(normal)/post/[source]/[id]/(detail)/query.js';
import { PostActionsWithGrid } from '@/components/Actions/index.js';
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
import { TweetUnavailableError } from '@/constants/error.js';
import { notFound } from '@/esm/navigation.js';
import { enqueueWarningMessage } from '@/helpers/enqueueMessage.js';

interface Props {
    id: string;
    source: SocialSource;
}

export function PageDetail({ id: postId, source }: Props) {
    if (!postId) notFound();

    const { data: post } = useSuspenseQuery(getPostDetailQuery(source, postId));
    const { data: threads } = useSuspenseQuery(getPostThreadQuery(source, postId, post));

    const isUnavailableTweet =
        post?.source === Source.Twitter && post.metadata.content?.content === TweetUnavailableError.message;

    useEffect(() => {
        if (isUnavailableTweet) {
            enqueueWarningMessage(TweetUnavailableError.message);
        }
    }, [isUnavailableTweet]);

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
                    <ChannelInfo channel={post.channel} source={post.source} className="border-line border-b p-3" />
                </Section>
            ) : null}
            {allPosts.length >= MIN_POST_SIZE_PER_THREAD ? (
                <article className="px-4 py-3">
                    {allPosts.map((post, index) => (
                        <ThreadBody
                            isDetail
                            post={post}
                            disableAnimate
                            showTranslate
                            key={post.postId}
                            isLast={index === allPosts.length - 1}
                        />
                    ))}
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
                                    className="border-line !mt-0 border-y py-3 pl-2 pr-4"
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
                            />
                        </Suspense>
                    </ErrorBoundary>
                </NoSSR>
            </Section>
            <PostDetailEffect post={post} />
        </article>
    );
}
