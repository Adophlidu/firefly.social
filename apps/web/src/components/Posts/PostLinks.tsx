'use client';

import { compact, last, uniq } from 'lodash-es';
import { memo, useEffect, useMemo } from 'react';

import { FrameSwiper } from '@/components/Posts/FrameSwiper.js';
import { PostLinkContent } from '@/components/Posts/PostLinkContent.js';
import { SUPPORTED_MULTIPLE_EMBED_SOURCES } from '@/constants/computed.js';
import type { SocialSource } from '@/constants/enum.js';
import { LINK_MARK_RE } from '@/constants/linkRegExp.js';
import { readChars } from '@/helpers/chars.js';
import { createDummyPost } from '@/helpers/createDummyPost.js';
import { patchPostQueryData } from '@/helpers/patchPostQueryData.js';
import { removeAtEnd } from '@/helpers/removeAtEnd.js';
import { resolveAllOembedUrls, resolveOembedUrl } from '@/helpers/resolveOembedUrl.js';
import { useClassifyPostLink, useClassifyPostLinks } from '@/hooks/useClassifyPostLink.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import type { Chars } from '@/types/chars.js';
import type { ComposeType } from '@/types/compose.js';

interface Props {
    post: Post;
    isInCompose?: boolean;
    hasRpPayload?: boolean;
    hasPoll?: boolean;
}

function PostLinksSingle({ post, isInCompose = false }: Props) {
    const url = resolveOembedUrl(post);
    const { isLoading, error, data = null } = useClassifyPostLink(url);

    const content = post.metadata.content?.content;
    useEffect(() => {
        if (!url || !content) return;

        const og = data?.oembed?.og;
        const isEmptyOg = !!og && !og.image && !og.title && !og.description;

        if (isLoading || (data && !isEmptyOg)) {
            patchPostQueryData(post.source, post.postId, (draft) => {
                if (draft.metadata.content?.content) {
                    draft.metadata.content.truncatedContent = removeAtEnd(draft.metadata.content.content, url);
                }
            });
            return;
        }
        if (!data || isEmptyOg) {
            patchPostQueryData(post.source, post.postId, (draft) => {
                if (draft.metadata.content?.content) {
                    draft.metadata.content.truncatedContent = draft.metadata.content.content;
                }
            });
        }
    }, [data, url, content, post.source, post.postId, isLoading]);

    if (!url || isLoading || error) return null;

    return <PostLinkContent data={data} url={url} post={post} isInCompose={isInCompose} />;
}

function PostLinksMultiple({ post, isInCompose = false, hasRpPayload = false }: Props) {
    const urls = resolveAllOembedUrls(post);
    const { isLoading, data } = useClassifyPostLinks(urls);

    if (isLoading || !data?.length) return null;

    const frames = data.filter((x) => !!x.result.frame);
    const openGraphs = compact(
        urls.map((url) => {
            const matched = data.find((x) => x.url === url);
            if (matched?.result.oembed) return { url, result: matched.result };

            return !matched ? { url, result: null } : null;
        }),
    );
    const lastOpenGraph = hasRpPayload ? null : last(openGraphs);
    const otherLinks =
        frames.length > 1
            ? data.filter((x) => !x.result.oembed && !x.result.frame)
            : data.filter((x) => !x.result.oembed);

    if ((frames.length >= 1 || otherLinks.length >= 1) && lastOpenGraph?.result?.oembed?.og) {
        lastOpenGraph.result.oembed.og = {
            ...lastOpenGraph.result.oembed.og,
            isLarge: false,
        };
    }

    return (
        <>
            {frames.length > 1 ? (
                <FrameSwiper
                    frames={frames.map((x) => ({
                        frame: x.result.frame!,
                        url: x.url,
                    }))}
                    post={post}
                />
            ) : null}
            {compact([...otherLinks, lastOpenGraph]).map((x) => (
                <PostLinkContent key={x.url} data={x.result} url={x.url} post={post} isInCompose={isInCompose} />
            ))}
        </>
    );
}

export const PostLinks = memo(function PostLinks({ post, isInCompose = false, hasRpPayload, hasPoll }: Props) {
    const urls = resolveAllOembedUrls(post);
    if (urls.length > 1 && SUPPORTED_MULTIPLE_EMBED_SOURCES.includes(post.source)) {
        return <PostLinksMultiple post={post} isInCompose={isInCompose} hasRpPayload={hasRpPayload} />;
    }

    return hasRpPayload || hasPoll ? null : <PostLinksSingle post={post} isInCompose={isInCompose} />;
});

export function PostLinksInCompose({
    type,
    chars,
    urls,
    source,
    parentPost,
}: {
    type: ComposeType;
    urls: string[];
    chars: Chars;
    source: SocialSource;
    parentPost?: Post | null;
}) {
    const post = useMemo(() => {
        const content = readChars({ chars, strategy: 'visible' });
        const oembedUrls = (content.match(LINK_MARK_RE) || []).filter((url) => {
            const index = content.indexOf(url);
            if (['@'].includes(content[index - 1]) && !url.startsWith('http')) return false;
            return true;
        });
        const oembedUrl = last(uniq([...oembedUrls, ...urls]));

        return {
            ...createDummyPost(source, content, oembedUrl, oembedUrls),
            quoteOn: type === 'quote' ? (parentPost ?? undefined) : undefined,
        } satisfies Post;
    }, [chars, urls, parentPost, source, type]);

    return <PostLinks post={post} isInCompose />;
}
