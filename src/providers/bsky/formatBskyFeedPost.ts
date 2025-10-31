import {
    AppBskyEmbedExternal,
    AppBskyEmbedImages,
    AppBskyEmbedRecord,
    AppBskyEmbedRecordWithMedia,
    AppBskyEmbedVideo,
    AppBskyFeedDefs,
    AppBskyFeedPost,
    AppBskyFeedThreadgate,
    RichText,
} from '@atproto/api';
import { parseUrl } from '@firefly/utils';
import { produce } from 'immer';
import { compact, first, isUndefined, omitBy } from 'lodash-es';

import { RestrictionType, Source } from '@/constants/enum.js';
import { TENOR_GIF_REGEXP } from '@/constants/regexp.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { PostAtUri } from '@/providers/bsky/AtUri.js';
import { formatBskyProfile } from '@/providers/bsky/formatBskyProfile.js';
import { type Attachment, type Post, type Profile, SessionType } from '@/providers/types/SocialMedia.js';

function parseBskyGifUri(uri: string): boolean {
    const parsedURL = parseUrl(uri);
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
    if (AppBskyEmbedExternal.isView(embed) && parseBskyGifUri(embed.external.uri)) {
        const [, ns = '', name = ''] = embed.external.uri.match(TENOR_GIF_REGEXP) || [];
        if (ns.endsWith('AC') && name && embed.external.thumb) {
            attachments.push({
                type: 'AnimatedGif',
                // gif -> webm
                uri: `https://media.tenor.com/${ns.replace(/AC$/, 'P3')}/${name}.webm`,
                coverUri: embed.external.thumb,
                title: embed.external.title,
            });
        } else {
            attachments.push({
                type: 'Image',
                uri: embed.external.uri,
            });
        }
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

function resolveRestrictions(gatedPost: AppBskyFeedDefs.ThreadgateView) {
    if (AppBskyFeedThreadgate.isRecord(gatedPost.record)) {
        const { allow } = gatedPost.record;
        if (!allow || !Array.isArray(allow)) return [RestrictionType.Everyone];
        if (allow.length === 0) return [RestrictionType.Nobody];

        return compact(
            allow.map((rule) => {
                if (AppBskyFeedThreadgate.isFollowingRule(rule)) {
                    return RestrictionType.OnlyPeopleYouFollow;
                }
                if (AppBskyFeedThreadgate.isFollowerRule(rule)) {
                    return RestrictionType.YouFollower;
                }
                if (AppBskyFeedThreadgate.isMentionRule(rule)) {
                    return RestrictionType.MentionedProfiles;
                }

                return null;
            }),
        );
    }

    return [RestrictionType.Everyone];
}

function formatBskyPostView(original: AppBskyFeedDefs.PostView): Post {
    const record = AppBskyFeedPost.isRecord(original.record) ? original.record : { text: '', langs: ['en'] };
    const createdAt = original.createdAt || original.indexedAt;

    const post: Post = {
        publicationId: original.cid,
        postId: PostAtUri.from(original.uri).toId(),
        type: 'Post',
        source: Source.Bsky,
        canQuote: original.viewer?.embeddingDisabled !== true,
        restrictions: original.threadgate ? resolveRestrictions(original.threadgate) : undefined,
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
            contentURI: original.uri,
            content: {
                content: record.text,
                ...formatBskyMedia(original.embed),
            },
        },
    };
    if (AppBskyFeedPost.isRecord(original.record)) {
        const { contentArr, mentions, oembedUrls } = [
            ...new RichText({ text: record.text, facets: original.record.facets }).segments(),
        ].reduce<{
            mentions: Profile[];
            oembedUrls: string[];
            contentArr: string[];
        }>(
            (acc, segment) => {
                acc.contentArr.push(segment.isLink() && segment.link?.uri ? segment.link.uri : segment.text);
                if (segment.isLink() && segment.link?.uri) {
                    acc.oembedUrls.push(segment.link.uri);
                }
                if (segment.isMention() && segment.mention?.did) {
                    const handle = segment.text.replace(/^@/, '');

                    acc.mentions.push({
                        ...createDummyProfile(Source.Bsky),
                        profileId: segment.mention.did,
                        displayName: handle,
                        handle,
                        fullHandle: handle,
                    });
                }
                return acc;
            },
            {
                mentions: [],
                oembedUrls: [],
                contentArr: [],
            },
        );
        const content = contentArr.join(' ');
        post.mentions = mentions;
        post.metadata.content = {
            ...formatBskyMedia(original.embed),
            content,
            oembedUrls,
            oembedUrl: first(oembedUrls),
        };
        if (original.record.reply?.parent.uri) {
            post.parentPostId = original.record.reply.parent.cid;
            post.parentContentURI = original.record.reply.parent.uri;
        }
        if (original.record.reply?.root.uri) {
            post.rootPostId = original.record.reply.root.cid;
            post.rootContentURI = original.record.reply.root.uri;
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

function isReplyRef(reply: unknown): reply is AppBskyFeedDefs.ReplyRef {
    return !!reply && typeof reply === 'object' && 'parent' in reply && 'root' in reply;
}

export function formatBskyFeedPost(original: AppBskyFeedDefs.FeedViewPost | AppBskyFeedDefs.ThreadViewPost): Post {
    let post: Post = formatBskyPostView(original.post);
    post.__original__ = original;
    if (AppBskyFeedDefs.isThreadViewPost(original) && AppBskyFeedDefs.isThreadViewPost(original.parent)) {
        post.type = 'Comment';
        post.commentOn = formatBskyFeedPost(original.parent);
        post.parentPostId = original.parent.post.cid;
        post.parentContentURI = original.parent.post.uri;
    }
    if (
        isReplyRef(original.reply) &&
        AppBskyFeedDefs.isPostView(original.reply.parent) &&
        AppBskyFeedDefs.isPostView(original.reply.root)
    ) {
        post.type = 'Comment';
        post.commentOn = formatBskyPostView(original.reply.parent);
        post.root = formatBskyPostView(original.reply.root);
        post.parentPostId = original.reply.parent.cid;
        post.parentContentURI = original.reply.parent.uri;
        post.rootPostId = original.reply.root.cid;
        post.rootContentURI = original.reply.root.uri;
    }
    if (original.reason) {
        post.type = 'Mirror';
        post.mirrorOn = formatBskyPostView(original.post);
        if (AppBskyFeedDefs.isReasonRepost(original.reason)) {
            post.reporter = formatBskyProfile(original.reason.by);
            post.hasMirrored = post.reporter.profileId === getSessionFromStorage(SessionType.Bsky)?.profileId;
        }
    }
    if (AppBskyEmbedRecord.isView(original.post.embed) && AppBskyEmbedRecord.isViewRecord(original.post.embed.record)) {
        post.type = 'Quote';
        post.quoteOn = formatBskyViewRecord(original.post.embed.record);
        post.parentPostId = post.quoteOn.publicationId;
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

function formatBskyThreadParentPosts(thread: AppBskyFeedDefs.ThreadViewPost, posts: Post[] = []): Post[] {
    if (!thread.parent || !AppBskyFeedDefs.isThreadViewPost(thread.parent)) {
        return thread.post ? [formatBskyPostView(thread.post), ...posts] : posts;
    }
    const post = formatBskyPostView(thread.post);
    post.type = 'Comment';
    return formatBskyThreadParentPosts(thread.parent, [post, ...posts]);
}

function formatBskyThreadReplyPosts(
    keyPost: AppBskyFeedDefs.PostView,
    thread: AppBskyFeedDefs.ThreadViewPost,
    posts: Post[] = [],
): Post[] {
    if (!thread.replies) return posts;
    const reply = thread.replies.find(
        (reply) => AppBskyFeedDefs.isThreadViewPost(reply) && reply.post.author.did === keyPost.author.did,
    );
    if (!reply || !AppBskyFeedDefs.isThreadViewPost(reply)) return posts;
    const post = formatBskyPostView(reply.post);
    post.type = 'Comment';
    return formatBskyThreadReplyPosts(keyPost, reply, [...posts, post]);
}

/**
 * Converts a thread of posts from the Bluesky platform, originally in a linked list structure,
 * into a formatted array of post objects.
 */
export function formatBskyThreadPosts(thread: AppBskyFeedDefs.ThreadViewPost): Post[] {
    const parentPosts = formatBskyThreadParentPosts(thread);
    const posts = formatBskyThreadReplyPosts(thread.post, thread, parentPosts);
    return posts.map((post, i, arr) => {
        if (i === 0) return post;
        post.root = arr[0];
        post.commentOn = arr[i - 1];
        return post;
    });
}
