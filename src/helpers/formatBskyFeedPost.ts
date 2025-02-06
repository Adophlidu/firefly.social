import {
    AppBskyEmbedExternal,
    AppBskyEmbedImages,
    AppBskyEmbedRecord,
    AppBskyEmbedRecordWithMedia,
    AppBskyEmbedVideo,
    AppBskyFeedDefs,
} from '@atproto/api';
import { isViewRecord } from '@atproto/api/dist/client/types/app/bsky/embed/record.js';
import { isPostView, isThreadViewPost, type PostView } from '@atproto/api/dist/client/types/app/bsky/feed/defs.js';
import { parseURL } from '@masknet/shared-base';
import { produce } from 'immer';
import { first, isUndefined, omitBy } from 'lodash-es';

import { Source } from '@/constants/enum.js';
import { formatBskyProfile } from '@/helpers/formatBskyProfile.js';
import { getEmbedUrls } from '@/helpers/getEmbedUrls.js';
import { isSamePost } from '@/helpers/isSamePost.js';
import { PostAtUri } from '@/providers/bsky/AtUri.js';
import type { Attachment, Post } from '@/providers/types/SocialMedia.js';

function parseBskyGifUri(uri: string): boolean {
    const parsedURL = parseURL(uri);
    if (!parsedURL) return false;
    const height = parsedURL.searchParams.get('hh');
    const width = parsedURL.searchParams.get('ww');
    const isEndOfGIF = parsedURL.pathname.endsWith('.gif');
    return isEndOfGIF && !!height && !!width;
}

function formatBskyMedia(embed: unknown): Post['metadata']['content'] {
    const attachments: Attachment[] = [];
    if (AppBskyEmbedImages.isView(embed)) {
        attachments.push(
            ...embed.images.map<Attachment>((image) => {
                return {
                    type: 'Image',
                    uri: image.thumb,
                };
            }),
        );
    }
    if (AppBskyEmbedExternal.isView(embed) && parseBskyGifUri(embed.external.uri) && embed.external.thumb) {
        attachments.push({
            type: 'AnimatedGif',
            uri: embed.external.uri,
            coverUri: embed.external.thumb,
            title: embed.external.title,
        });
    }
    if (AppBskyEmbedVideo.isView(embed)) {
        attachments.push({
            type: 'Video',
            uri: embed.playlist,
            coverUri: embed.thumbnail,
        });
    }
    const oembedUrl = AppBskyEmbedExternal.isView(embed) ? embed.external.uri : undefined;
    return omitBy(
        {
            attachments,
            oembedUrl,
            asset: first(attachments),
        },
        isUndefined,
    );
}

function formatBskyPostView(original: AppBskyFeedDefs.PostView): Post {
    const record = original.record as { langs: string[]; text: string; embed: [] };
    const oembedUrls = getEmbedUrls(record.text, []);
    const createdAt = original.createdAt || original.indexedAt;

    return {
        publicationId: original.cid,
        postId: PostAtUri.from(original.uri).toId(),
        type: 'Post',
        source: Source.Bsky,
        canComment: true,
        author: formatBskyProfile(original.author),
        stats: {
            reactions: original.likeCount ?? 0,
            comments: original.replyCount ?? 0,
            mirrors: original.repostCount ?? 0,
            quotes: original.quoteCount ?? 0,
        },
        hasLiked: !!original.viewer?.like,
        hasMirrored: !!original.viewer?.repost,
        timestamp: createdAt && typeof createdAt === 'string' ? new Date(createdAt).getTime() : Date.now(),
        metadata: {
            contentURI: original.uri,
            locale: record.langs?.[0] ?? 'en',
            content: {
                content: record.text,
                oembedUrls,
                oembedUrl: first(oembedUrls),
                ...formatBskyMedia(original.embed),
            },
        },
    };
}

function formatBskyViewRecord(original: AppBskyEmbedRecord.ViewRecord) {
    return formatBskyPostView({
        ...original,
        record: original.value,
    });
}

function formatBskyViewRecordWithMedia(post: Post, original: AppBskyEmbedRecordWithMedia.View) {
    return produce(post, (draft) => {
        if (isViewRecord(original.record.record)) {
            draft.quoteOn = formatBskyPostView({
                ...original.record.record,
                record: original.record.record.value,
            });
        }
        if (draft.metadata.content) {
            draft.metadata.content = {
                ...post.metadata.content,
                ...formatBskyMedia(original.media),
            };
        }
        return draft;
    });
}

export function formatBskyPost(original: PostView) {
    let post: Post = formatBskyPostView(original);
    post.__original__ = original;
    if (AppBskyEmbedRecord.isView(original.embed) && isViewRecord(original.embed.record)) {
        post.type = 'Quote';
        post.quoteOn = formatBskyViewRecord(original.embed.record);
    }
    if (AppBskyEmbedRecordWithMedia.isView(original.embed)) {
        post.type = 'Quote';
        post = formatBskyViewRecordWithMedia(post, original.embed);
    }
    return post;
}

export function formatBskyFeedPost(original: AppBskyFeedDefs.FeedViewPost): Post {
    let post: Post = formatBskyPostView(original.post);
    post.__original__ = original;
    if (original.reply?.root && isPostView(original.reply?.root)) {
        post.root = formatBskyPostView(original.reply.root);
        post.rootPostId = original.reply.root.cid;
        post.rootContentURI = original.reply.root.uri;
    }
    if (original.reply && isPostView(original.reply.parent)) {
        post.type = 'Comment';
        post.commentOn = formatBskyPostView(original.reply.parent);
        if (isPostView(original.reply.root)) post.root = formatBskyPostView(original.reply.root);
        if (isSamePost(post.commentOn, post.root)) {
            delete post.commentOn;
        }
    }
    if (original.reason) {
        post.type = 'Mirror';
        post.mirrorOn = formatBskyPostView(original.post);
        if (AppBskyFeedDefs.isReasonRepost(original.reason)) {
            post.reporter = formatBskyProfile(original.reason.by);
        }
    }
    if (AppBskyEmbedRecord.isView(original.post.embed) && isViewRecord(original.post.embed.record)) {
        post.type = 'Quote';
        post.quoteOn = formatBskyViewRecord(original.post.embed.record);
    }
    if (AppBskyEmbedRecordWithMedia.isView(original.post.embed)) {
        post.type = 'Quote';
        post = formatBskyViewRecordWithMedia(post, original.post.embed);
    }
    return post;
}

export function formatBskyThreadPosts(thread: AppBskyFeedDefs.ThreadViewPost, posts: Post[] = []): Post[] {
    if (!thread.parent || !isThreadViewPost(thread.parent)) return posts;
    const post = formatBskyPostView(thread.post);
    if (posts.length) {
        post.type = 'Comment';
        post.root = posts[0];
        post.commentOn = posts.at(-1);
    }
    return formatBskyThreadPosts(thread.parent, [post, ...posts]);
}
