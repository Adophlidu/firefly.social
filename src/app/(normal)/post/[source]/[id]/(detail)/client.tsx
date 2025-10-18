'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { Suspense } from 'react';

import LoadingPage from '@/app/(normal)/post/[source]/[id]/(detail)/loading.js';
import { getPostDetailQuery, getPostThreadQuery } from '@/app/(normal)/post/[source]/[id]/(detail)/query.js';
import { PostActionsWithGrid } from '@/components/Actions/index.js';
import { PostStatistics } from '@/components/Actions/PostStatistics.js';
import { QuickReply } from '@/components/Actions/QuickReply.js';
import { ChannelInfo } from '@/components/Channel/ChannelInfo.js';
import { CommentList } from '@/components/Comments/index.js';
import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { PostDetailEffect } from '@/components/PostDetailEffect.js';
import { SinglePost } from '@/components/Posts/SinglePost.js';
import { ThreadBody } from '@/components/Posts/ThreadBody.js';
import { Section } from '@/components/Semantic/Section.js';
import { type SocialSource } from '@/constants/enum.js';
import { EMPTY_LIST, MIN_POST_SIZE_PER_THREAD } from '@/constants/index.js';
import { notFound } from '@/esm/navigation.js';

interface Props {
    id: string;
    source: SocialSource;
}

export function PageDetail({ id: postId, source }: Props) {
    if (!postId) notFound();
    const { data: post, isLoading, isRefetching } = useSuspenseQuery(getPostDetailQuery(source, postId));
    const {
        data: threads,
        isLoading: threadLoading,
        isRefetching: threadRefetching,
    } = useSuspenseQuery(getPostThreadQuery(source, postId, post));

    if ((isLoading || isRefetching || threadLoading || threadRefetching) && !post) return <LoadingPage />;
    if (!post) notFound();

    const allPosts = threads?.data || EMPTY_LIST;

    return (
        <article className="min-h-svh">
            {post.channel?.name ? (
                <Section title="Post Channel">
                    <ChannelInfo channel={post.channel} source={post.source} className="border-b border-line p-3" />
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
                    <Suspense fallback={<Loading />}>
                        <CommentList
                            postId={post.postId}
                            source={source}
                            excludePostIds={
                                allPosts.length >= MIN_POST_SIZE_PER_THREAD ? allPosts.map((x) => x.postId) : []
                            }
                        />
                    </Suspense>
                </NoSSR>
            </Section>
            <PostDetailEffect post={post} />
        </article>
    );
}
