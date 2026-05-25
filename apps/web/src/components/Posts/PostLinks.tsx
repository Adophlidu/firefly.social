'use client';

import { SUPPORTED_MULTIPLE_EMBED_SOURCES } from '@dimensiondev/constants/computed';
import type { SocialSource } from '@dimensiondev/enums';
import { compact, last, uniq } from 'lodash-es';
import { memo, useEffect, useMemo } from 'react';

import { FrameSwiper } from '@/components/Posts/FrameSwiper.js';
import { PostLinkContent } from '@/components/Posts/PostLinkContent.js';
import { LINK_MARK_RE } from '@/constants/linkRegExp.js';
import { readChars } from '@/helpers/chars.js';
import { createDummyPost } from '@/helpers/createDummyPost.js';
import { patchPostQueryData } from '@/helpers/patchPostQueryData.js';
import { removeAtEnd } from '@/helpers/removeAtEnd.js';
import { resolveAllOembedUrls, resolveOembedUrl } from '@/helpers/resolveOembedUrl.js';
import { useClassifyPostLink, useClassifyPostLinks } from '@/hooks/useClassifyPostLink.js';
import type { ClassifyPostLinkResult } from '@/providers/firefly/worker/getClassifyPostLinks.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import type { Chars } from '@/types/chars.js';
import type { ComposeType } from '@/types/compose.js';

/**
 * Returns a stable identity key for a classified result so that two different
 * oembedUrls that resolve to the same content (e.g. a snap API URL and its
 * regular page URL) are treated as duplicates and only rendered once.
 * Returns null for result types that don't need content-level dedup (oembed
 * link cards are already handled by the lastOpenGraph logic).
 */
function getResultDedupeKey(result: ClassifyPostLinkResult): string | null {
    // snap.url is set by the worker to the input URL, so two different oembedUrls
    // that serve identical snap content (e.g. /api/farcaster/snap/… vs /clanker/…)
    // will have different snap.url values. Use the rendered UI tree as the identity
    // instead — same content means same ui.root + ui.elements.
    if (result.snap) return `snap:${JSON.stringify(result.snap.ui)}`;
    if (result.frame) {
        const frameUrl = result.frame.x_version === 1 ? result.frame.url : result.frame.x_url;
        return `frame:${frameUrl}`;
    }
    if (result.article?.id) return `article:${result.article.id}`;
    if (result.snapshot?.id) return `snapshot:${result.snapshot.id}`;
    if (result.nft) return `nft:${result.nft.contract_address}:${result.nft.token_id}`;
    if (result.collection?.contract_address) return `collection:${result.collection.contract_address}`;
    if (result.quote?.postId) return `quote:${result.quote.postId}`;
    if (result.prediction_event?.id) return `prediction_event:${result.prediction_event.id}`;
    if (result.prediction_profile?.wallet) return `prediction_profile:${result.prediction_profile.wallet}`;
    if (result.spaceId) return `space:${result.spaceId}`;
    return null;
}

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
    // Stabilize the URL array so it doesn't thrash memo dependencies on every render.
    const urls = useMemo(() => resolveAllOembedUrls(post), [post]);
    const { isLoading, data: rawData } = useClassifyPostLinks(urls);

    const processed = useMemo(() => {
        if (!rawData?.length) return null;

        // Single pass: dedup by content identity, build URL→result index, collect
        // frames and snap hostnames — avoids 4-5 separate filter/find passes.
        const seenKeys = new Set<string>();
        const data: typeof rawData = [];
        const frames: typeof rawData = [];
        const richContentHostnames = new Set<string>();
        const dataByUrl = new Map<string, (typeof rawData)[number]>();

        for (const item of rawData) {
            const key = getResultDedupeKey(item.result);
            if (key && seenKeys.has(key)) continue;
            if (key) seenKeys.add(key);
            data.push(item);
            dataByUrl.set(item.url, item);
            if (item.result.frame) frames.push(item);
            const { snap, frame, article, snapshot, nft, collection, quote, prediction_event, prediction_profile } =
                item.result;
            if (
                snap ||
                frame ||
                article ||
                snapshot ||
                nft ||
                collection ||
                quote ||
                prediction_event ||
                prediction_profile
            ) {
                try {
                    richContentHostnames.add(new URL(item.url).hostname);
                } catch {}
            }
        }

        // O(1) lookup via Map instead of O(n) Array.find per URL.
        const openGraphs = compact(
            urls.map((url) => {
                const matched = dataByUrl.get(url);
                if (matched?.result.oembed) return { url, result: matched.result };
                return !matched ? { url, result: null } : null;
            }),
        );

        const otherLinks =
            frames.length > 1
                ? data.filter((x) => !x.result.oembed && !x.result.frame)
                : data.filter((x) => !x.result.oembed);

        // Suppress the oembed link preview when a snap from the same host is already
        // shown — the snap card is a superset of what a plain link preview shows.
        let lastOpenGraph: (typeof openGraphs)[number] | null = hasRpPayload ? null : (last(openGraphs) ?? null);
        if (lastOpenGraph) {
            try {
                if (richContentHostnames.has(new URL(lastOpenGraph.url).hostname)) lastOpenGraph = null;
            } catch {}
        }
        // Make the oembed small when other rich embeds are present. Produce a new
        // object instead of mutating the cached result from React Query.
        if (lastOpenGraph && (frames.length >= 1 || otherLinks.length >= 1) && lastOpenGraph.result?.oembed?.og) {
            lastOpenGraph = {
                ...lastOpenGraph,
                result: {
                    ...lastOpenGraph.result,
                    oembed: {
                        ...lastOpenGraph.result.oembed,
                        og: { ...lastOpenGraph.result.oembed.og, isLarge: false },
                    },
                },
            };
        }

        return { data, frames, otherLinks, lastOpenGraph };
    }, [rawData, urls, hasRpPayload]);

    if (isLoading || !processed) return null;

    const { frames, otherLinks, lastOpenGraph } = processed;

    return (
        <>
            {frames.length > 1 ? (
                <FrameSwiper frames={frames.map((x) => ({ frame: x.result.frame!, url: x.url }))} post={post} />
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
