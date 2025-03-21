'use client';

import { useQuery } from '@tanstack/react-query';
import { last } from 'lodash-es';
import { useRouter } from 'next/navigation.js';
import { memo, useEffect, useMemo } from 'react';

import { ArticleBody } from '@/components/Article/ArticleBody.js';
import { ActionContainer } from '@/components/Blink/ActionContainer.js';
import { FrameLayout } from '@/components/Frame/Layout.js';
import { OembedLayout } from '@/components/Oembed/index.js';
import { Player } from '@/components/Oembed/Player.js';
import { TweetSpace } from '@/components/Posts/TweetSpace.js';
import { RocketsFunCard } from '@/components/RocketsFun/RocketsFunCard.js';
import { SnapshotBody } from '@/components/Snapshot/SnapshotBody.js';
import { type SocialSource } from '@/constants/enum.js';
import { LINK_MARK_RE } from '@/constants/linkRegExp.js';
import type { Chars } from '@/helpers/chars.js';
import { readChars } from '@/helpers/chars.js';
import { createDummyPost } from '@/helpers/createDummyPost.js';
import { getArticleUrl } from '@/helpers/getArticleUrl.js';
import { isLinkMatchingHost } from '@/helpers/isLinkMatchingHost.js';
import { patchPostQueryData } from '@/helpers/patchPostQueryData.js';
import { removeAtEnd } from '@/helpers/removeAtEnd.js';
import { resolveOembedUrl } from '@/helpers/resolveOembedUrl.js';
import { useClassifyPostLink } from '@/hooks/useClassifyPostLink.js';
import { FireflyArticleProvider } from '@/providers/firefly/Article.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import type { ComposeType } from '@/types/compose.js';

interface Props {
    post: Post;
    isInCompose?: boolean;
}

export const PostLinks = memo(function PostLinks({ post, isInCompose = false }: Props) {
    const router = useRouter();
    const url = resolveOembedUrl(post);
    const { isLoading, error, data } = useClassifyPostLink(url, post);

    const { data: article } = useQuery({
        enabled: !!data?.articleId,
        queryKey: ['article-detail', data?.articleId],
        queryFn: async () => {
            if (!data?.articleId) return;
            return FireflyArticleProvider.getArticleById(data.articleId);
        },
    });

    const content = post.metadata.content?.content;
    useEffect(() => {
        if (data && url && content) {
            patchPostQueryData(post.source, post.postId, (draft) => {
                if (draft.metadata.content?.content) {
                    draft.metadata.content.truncatedContent = removeAtEnd(draft.metadata.content.content, url);
                }
            });
        }
    }, [data, url, content, post.source, post.postId]);

    if (!url || isLoading || error || !data) return null;

    return (
        <>
            {article ? (
                <ArticleBody
                    article={article}
                    onClick={() => {
                        if (!article || article.author.isMuted) return;

                        const selection = window.getSelection();
                        if (selection && selection.toString().length !== 0) return;

                        if (isInCompose) return;

                        router.push(getArticleUrl(article));
                        return;
                    }}
                />
            ) : null}
            {data.snapshot && !isInCompose ? (
                <SnapshotBody snapshot={data.snapshot} link={url} postId={post.postId} />
            ) : null}
            {data.html ? (
                <Player html={data.html} isSpotify={isLinkMatchingHost(url, 'open.spotify.com', false)} />
            ) : null}
            {data.frame ? <FrameLayout frame={data.frame} post={post} /> : null}
            {data.action ? <ActionContainer action={data.action} url={url} /> : null}
            {data.oembed ? <OembedLayout data={data.oembed} post={post} isInCompose={isInCompose} /> : null}
            {data.spaceId ? <TweetSpace spaceId={data.spaceId} /> : null}
            {data.token ? <RocketsFunCard token={data.token} url={url} /> : null}
        </>
    );
});

export function PostLinksInCompose({
    type,
    chars,
    source,
    parentPost,
}: {
    chars: Chars;
    source: SocialSource;
    type: ComposeType;
    parentPost?: Post | null;
}) {
    const post = useMemo(() => {
        const content = readChars(chars, 'visible');
        const oembedUrls = (content.match(LINK_MARK_RE) || []).filter((url) => {
            const index = content.indexOf(url);
            if (['@'].includes(content[index - 1]) && !url.startsWith('http')) return false;
            return true;
        });
        const oembedUrl = last(oembedUrls);

        return {
            ...createDummyPost(source, content, oembedUrl, oembedUrls),
            quoteOn: type === 'quote' ? (parentPost ?? undefined) : undefined,
        } satisfies Post;
    }, [chars, parentPost, source, type]);

    return <PostLinks post={post} isInCompose />;
}
