import { Source } from '@dimensiondev/enums';
import type { AppBskyFeedDefs } from '@atproto/api';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { runInSafeAsync, safeUnreachable } from '@dimensiondev/utils';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@dimensiondev/utils';
import { isZero } from '@dimensiondev/web3/numbers';
import { compact, uniq } from 'lodash-es';

import { formatBskyFeedPost, formatBskyPost } from '@/providers/bsky/formatBskyFeedPost.js';
import { formatBskyProfile } from '@/providers/bsky/formatBskyProfile.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import {
    type CommentNotification,
    type FollowNotification,
    type MentionNotification,
    type MirrorNotification,
    type Notification,
    NotificationType,
    type QuoteNotification,
    type ReactionNotification,
} from '@/providers/types/SocialMedia.js';

export async function getBskyNotifications(
    indicator?: PageIndicator,
    signal?: AbortSignal,
): Promise<Pageable<Notification, PageIndicator>> {
    const response = await bskySessionHolder.agent.listNotifications(
        {
            limit: 25,
            cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
        },
        { signal },
    );
    const data = resolveBskyResponseData(response, 'Failed to get notifications.');

    const postIds = uniq(
        compact(
            data.notifications.flatMap((x) => {
                switch (x.reason) {
                    case 'like':
                        return [(x.record as { subject: { uri: string } }).subject.uri];
                    case 'reply':
                        const parentUri = (x.record as { reply: { parent: { uri: string } } })?.reply?.parent?.uri;
                        if (!parentUri) return EMPTY_LIST;

                        return [x.uri, parentUri];
                    case 'quote':
                        if (!x.reasonSubject) return EMPTY_LIST;

                        return [x.uri, x.reasonSubject];
                    case 'repost':
                        if (!x.reasonSubject) return [];
                        return [x.reasonSubject];
                    default:
                        return [];
                }
            }),
        ),
    );
    const posts = postIds.length
        ? await runInSafeAsync(async () => {
              const res = await bskySessionHolder.agent.getPosts(
                  {
                      uris: postIds,
                  },
                  { signal },
              );
              return resolveBskyResponseData(res).posts?.map((x) => formatBskyPost(x));
          })
        : EMPTY_LIST;

    const notifications = compact(
        await Promise.all(
            data.notifications.map(async (x) => {
                const timestamp = x.indexedAt ? new Date(x.indexedAt).getTime() : undefined;

                switch (x.reason) {
                    case 'follow':
                        return {
                            source: Source.Bsky,
                            notificationId: x.cid,
                            type: NotificationType.Follow,
                            followers: [formatBskyProfile(x.author)],
                        } satisfies FollowNotification;
                    case 'like':
                        const postUri = (x.record as { subject: { uri: string } }).subject.uri;
                        const post = posts?.find((p) => p.metadata.contentURI === postUri);
                        if (!post) return null;

                        return {
                            source: Source.Bsky,
                            notificationId: x.cid,
                            type: NotificationType.Reaction,
                            reactors: [formatBskyProfile(x.author)],
                            post,
                            timestamp,
                        } satisfies ReactionNotification;
                    case 'reply':
                        const parentUri = (x.record as { reply: { parent: { uri: string } } })?.reply?.parent?.uri;
                        if (!parentUri) return null;

                        const comment = posts?.find((p) => p.metadata.contentURI === x.uri);
                        const parentPost = posts?.find((p) => p.metadata.contentURI === parentUri);
                        if (!comment || !parentPost) return null;

                        return {
                            source: Source.Bsky,
                            notificationId: x.cid,
                            type: NotificationType.Comment,
                            comment: comment
                                ? {
                                      ...comment,
                                      type: 'Comment',
                                      commentOn: parentPost,
                                  }
                                : null,
                            post: parentPost,
                            timestamp,
                        } satisfies CommentNotification;
                    case 'mention':
                        return {
                            source: Source.Bsky,
                            notificationId: x.cid,
                            type: NotificationType.Mention,
                            post: formatBskyFeedPost({ post: x } as AppBskyFeedDefs.FeedViewPost),
                            timestamp,
                        } satisfies MentionNotification;
                    case 'quote':
                        if (!x.reasonSubject) return null;

                        const quote = posts?.find((p) => p.metadata.contentURI === x.uri);
                        const targetPost = posts?.find((p) => p.metadata.contentURI === x.reasonSubject);
                        if (!quote || !targetPost) return null;

                        return {
                            source: Source.Bsky,
                            notificationId: x.cid,
                            type: NotificationType.Quote,
                            quote: {
                                ...quote,
                                type: 'Quote',
                                quoteOn: targetPost,
                            },
                            post: targetPost,
                            timestamp,
                        } satisfies QuoteNotification;
                    case 'repost':
                        if (!x.reasonSubject) return null;

                        const originalPost = posts?.find((p) => p.metadata.contentURI === x.reasonSubject);
                        if (!originalPost) return null;

                        return {
                            source: Source.Bsky,
                            notificationId: x.cid,
                            type: NotificationType.Mirror,
                            mirrors: [formatBskyProfile(x.author)],
                            post: originalPost,
                            timestamp,
                        } satisfies MirrorNotification;
                    case 'starterpack-joined':
                        return null;
                    default:
                        safeUnreachable(x.reason as never);
                        return null;
                }
            }),
        ),
    );

    return createPageable(
        notifications,
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
    );
}
