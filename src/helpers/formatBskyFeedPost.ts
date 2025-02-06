import {
    AppBskyEmbedExternal,
    AppBskyEmbedImages,
    AppBskyEmbedRecord,
    AppBskyEmbedRecordWithMedia,
    AppBskyEmbedVideo,
    AppBskyFeedDefs,
    AppBskyFeedPost,
    AppBskyRichtextFacet,
} from '@atproto/api';
import { parseURL } from '@masknet/shared-base';
import { produce } from 'immer';
import { first, isUndefined, omitBy } from 'lodash-es';

import { Source } from '@/constants/enum.js';
import { formatBskyProfile } from '@/helpers/formatBskyProfile.js';
import { isSamePost } from '@/helpers/isSamePost.js';
import { PostAtUri } from '@/providers/bsky/AtUri.js';
import { type Attachment, type Post, type Profile, ProfileStatus } from '@/providers/types/SocialMedia.js';

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
    const record = AppBskyFeedPost.isRecord(original.record) ? original.record : { text: '', langs: ['en'] };
    const createdAt = original.createdAt || original.indexedAt;

    const post: Post = {
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
            locale: record.langs?.[0] ?? 'en',
            content: {
                content: record.text,
                ...formatBskyMedia(original.embed),
            },
        },
    };
    if (AppBskyFeedPost.isRecord(original.record)) {
        let content = record.text;
        const oembedUrls: string[] = [];
        const mentions: Profile[] = [];
        if (original.record.facets) {
            original.record.facets?.forEach((facet, i) => {
                const feature = facet.features[0];
                if (AppBskyRichtextFacet.isLink(feature)) {
                    content = content.replaceAll(
                        record.text.substring(facet.index.byteStart, facet.index.byteEnd),
                        feature.uri,
                    );
                    oembedUrls.push(feature.uri);
                }
                if (AppBskyRichtextFacet.isMention(feature)) {
                    const handle = record.text.substring(facet.index.byteStart, facet.index.byteEnd);
                    mentions.push({
                        profileId: feature.did,
                        profileSource: Source.Bsky,
                        displayName: handle,
                        handle,
                        fullHandle: handle,
                        pfp: '',
                        source: Source.Bsky,
                        followerCount: 0,
                        followingCount: 0,
                        status: ProfileStatus.Active,
                        verified: true,
                    });
                }
            });
        }
        post.mentions = mentions;
        post.metadata.content = {
            ...formatBskyMedia(original.embed),
            content,
            oembedUrls,
            oembedUrl: first(oembedUrls),
        };
        if (original.record.reply?.parent.uri) {
            post.parentPostId = PostAtUri.from(original.record.reply.parent.uri).toId();
            post.parentContentURI = original.record.reply.parent.uri;
        }
        if (original.record.reply?.root.uri) {
            post.rootPostId = PostAtUri.from(original.record.reply.parent.uri).toId();
            post.rootContentURI = original.record.reply.parent.uri;
        }
    }

    return post;
}

function formatBskyViewRecord(original: AppBskyEmbedRecord.ViewRecord) {
    return formatBskyPostView({
        ...original,
        record: original.value,
    });
}

function formatBskyViewRecordWithMedia(post: Post, original: AppBskyEmbedRecordWithMedia.View) {
    return produce(post, (draft) => {
        if (AppBskyEmbedRecord.isViewRecord(original.record.record)) {
            draft.quoteOn = formatBskyPostView({
                ...original.record.record,
                record: original.record.record.value,
            });
            draft.parentPostId = draft.quoteOn.postId;
            draft.parentContentURI = draft.quoteOn.metadata.contentURI;
            draft.rootPostId = draft.quoteOn.postId;
            draft.rootContentURI = draft.quoteOn.metadata.contentURI;
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

export function formatBskyPost(original: AppBskyFeedDefs.PostView) {
    let post: Post = formatBskyPostView(original);
    post.__original__ = original;
    if (AppBskyEmbedRecord.isView(original.embed) && AppBskyEmbedRecord.isViewRecord(original.embed.record)) {
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
    if (original.reply && AppBskyFeedDefs.isPostView(original.reply.parent)) {
        post.type = 'Comment';
        post.commentOn = formatBskyPostView(original.reply.parent);
        post.parentPostId = PostAtUri.from(original.reply.parent.uri).toId();
        post.parentContentURI = original.reply.parent.uri;
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
    if (AppBskyEmbedRecord.isView(original.post.embed) && AppBskyEmbedRecord.isViewRecord(original.post.embed.record)) {
        post.type = 'Quote';
        post.quoteOn = formatBskyViewRecord(original.post.embed.record);
        post.parentPostId = post.quoteOn.postId;
        post.parentContentURI = post.quoteOn.metadata.contentURI;
        post.rootPostId = post.quoteOn.postId;
        post.rootContentURI = post.quoteOn.metadata.contentURI;
    }
    if (AppBskyEmbedRecordWithMedia.isView(original.post.embed)) {
        post.type = 'Quote';
        post = formatBskyViewRecordWithMedia(post, original.post.embed);
    }
    return post;
}

export function formatBskyThreadPosts(thread: AppBskyFeedDefs.ThreadViewPost, posts: Post[] = []): Post[] {
    if (!thread.parent || !AppBskyFeedDefs.isThreadViewPost(thread.parent)) return posts;
    const post = formatBskyPostView(thread.post);
    if (posts.length) {
        post.type = 'Comment';
        post.root = posts[0];
        post.commentOn = posts.at(-1);
    }
    return formatBskyThreadPosts(thread.parent, [post, ...posts]);
}
