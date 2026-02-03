import { compact, first, isUndefined } from 'lodash-es';

import { Source } from '@/constants/enum.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { mergeNotifications } from '@/helpers/mergeNotifications.js';
import { getBestVideoUrl } from '@/providers/twitter/formatTwitterMedia.js';
import { convertTwitterAvatar } from '@/providers/twitter/formatTwitterProfile.js';
import {
    type Attachment,
    type CommentNotification,
    type FollowNotification,
    type MentionNotification,
    type MirrorNotification,
    type Notification,
    NotificationType,
    type Post,
    type PostType,
    type Profile,
    type QuoteNotification,
    type ReactionNotification,
} from '@/providers/types/SocialMedia.js';
import type {
    FavoriteEvent,
    FollowEvent,
    MessagesResponse,
    NotificationMedia,
    NotificationPost,
    NotificationUser,
    NotificationUserMention,
    TweetCreateEvent,
} from '@/providers/types/WebhookReceiver.js';

function formatNotificationUser(user: NotificationUser): Profile {
    return {
        ...createDummyProfile(Source.Twitter),
        profileId: user.id_str || user.id,
        fullHandle: user.screen_name,
        handle: user.screen_name,
        displayName: user.name,
        pfp: convertTwitterAvatar(user.profile_image_url_https || '') || '',
        bio: user.description || '',
        bioContext: {
            mentions: [],
        },
        followerCount: user.followers_count || 0,
        followingCount: user.friends_count || 0,
        verified: user.verified ?? false,
        protected: user.protected ?? false,
        viewerContext: undefined,
        website: user.url,
        location: user.location,
        __lazy__: true,
        __original__: user,
    };
}

function formatSendFrom(source: string) {
    const urlMatch = source.match(/<a href="(.*?)"/);
    const appUrl = urlMatch ? urlMatch[1] : undefined;
    const nameMatch = source.match(/>(.*?)<\/a>/);
    const appName = nameMatch ? nameMatch[1] : undefined;

    if (appName || appUrl) {
        return {
            name: appName,
            url: appUrl,
        };
    }

    return undefined;
}

function formatMedias(medias: NotificationMedia[]) {
    return compact(
        medias.map<Attachment | null>((media) => {
            switch (media.type) {
                case 'photo':
                    return media.media_url_https
                        ? {
                              type: 'Image',
                              uri: media.media_url_https,
                          }
                        : null;
                case 'animated_gif':
                    return media.video_info?.variants?.[0]?.url
                        ? {
                              type: 'AnimatedGif',
                              uri: media.video_info.variants[0].url,
                              coverUri: media.media_url_https,
                              width: media.sizes?.medium?.w,
                              height: media.sizes?.medium?.h,
                          }
                        : null;
                case 'video': {
                    const uri = getBestVideoUrl(media.video_info?.variants || []);
                    return uri
                        ? {
                              type: 'Video',
                              uri,
                              coverUri: media.media_url_https,
                              width: media.sizes?.medium?.w,
                              height: media.sizes?.medium?.h,
                          }
                        : null;
                }
            }
        }),
    );
}

function formatMentions(mentions: NotificationUserMention[]) {
    return mentions.map((mention) => ({
        ...createDummyProfile(Source.Twitter),
        profileId: mention.id_str,
        displayName: mention.name,
        handle: mention.screen_name,
        fullHandle: mention.screen_name,
    }));
}

function formatPostText(data: NotificationPost) {
    const start = data.truncated ? data.extended_tweet?.display_text_range?.[0] : data.display_text_range?.[0];
    const end = data.truncated ? data.extended_tweet?.display_text_range?.[1] : data.display_text_range?.[1];
    const text = data.truncated ? data.extended_tweet?.full_text || data.text : data.text;

    return !isUndefined(start) && !isUndefined(end) ? text.slice(start, end) : text;
}

function formatPostType(data: NotificationPost): PostType {
    if (data.is_quote_status) return 'Quote';
    if (data.retweeted_status) return 'Mirror';
    if (data.in_reply_to_status_id) return 'Comment';

    return 'Post';
}

function formatNotificationPost(data: NotificationPost): Post {
    const sendFrom = formatSendFrom(data.source);
    const attachments = formatMedias(data.extended_entities?.media || data.entities?.media || []);
    const type = formatPostType(data);

    const sendFromName = sendFrom?.name || data.source;
    const post: Post = {
        publicationId: data.id_str,
        postId: data.id_str,
        type,
        source: Source.Twitter,
        restrictions: undefined,
        author: formatNotificationUser(data.user),
        stats: {
            reactions: data.favorite_count ?? 0,
            comments: data.reply_count ?? 0,
            mirrors: data.retweet_count ?? 0,
            quotes: data.quote_count ?? 0,
        },
        timestamp: new Date(data.created_at).getTime(),
        mentions: formatMentions(data.entities.user_mentions || []),
        metadata: {
            locale: data.lang,
            content: {
                content: formatPostText(data),
                asset: first(attachments),
                attachments,
            },
        },
        sendFrom: sendFromName
            ? {
                  displayName: sendFromName,
                  name: sendFromName,
              }
            : undefined,
        __original__: data,
    };

    if (type === 'Quote' && data.quoted_status) {
        post.quoteOn = formatNotificationPost(data.quoted_status);
    }

    return post;
}

function formatFollowNotification(data: FollowEvent, viewerId: string): FollowNotification | null {
    if (data.source.id === viewerId) return null; // follow others

    return {
        source: Source.Twitter,
        type: NotificationType.Follow,
        notificationId: `follow_${data.created_timestamp}_${data.source.id}`,
        followers: [formatNotificationUser(data.source)],
    };
}

function formatFavoriteNotification(data: FavoriteEvent, viewerId: string): ReactionNotification | null {
    if (data.user.id_str === viewerId) return null; // favorite by viewer self

    return {
        source: Source.Twitter,
        notificationId: data.id,
        type: NotificationType.Reaction,
        reactors: [formatNotificationUser(data.user)],
        post: formatNotificationPost(data.favorited_status),
        timestamp: data.timestamp_ms,
    };
}

function formatCreateTweetNotification(data: TweetCreateEvent, viewerId: string) {
    if (data.is_quote_status && data.quoted_status?.user.id_str === viewerId) {
        // quote tweet
        return {
            source: Source.Twitter,
            notificationId: `quote_${data.id_str}_${data.quoted_status_id_str}`,
            type: NotificationType.Quote,
            quote: formatNotificationPost(data),
            post: formatNotificationPost(data.quoted_status),
            timestamp: new Date(data.created_at).getTime(),
        } satisfies QuoteNotification;
    }

    if (data.retweeted_status?.user.id_str === viewerId) {
        // retweet
        return {
            source: Source.Twitter,
            notificationId: `mirror_${data.id_str}_${data.retweeted_status.id_str}`,
            type: NotificationType.Mirror,
            mirrors: [formatNotificationUser(data.user)],
            post: formatNotificationPost(data.retweeted_status),
            timestamp: new Date(data.created_at).getTime(),
        } satisfies MirrorNotification;
    }

    if (data.in_reply_to_user_id_str === viewerId && data.in_reply_to_status_id) {
        // comment by viewer self
        if (data.user.id_str === viewerId) return null;

        // comment on viewer's post
        return {
            source: Source.Twitter,
            notificationId: `comment_${data.id_str}_${data.in_reply_to_status_id}`,
            type: NotificationType.Comment,
            comment: {
                ...formatNotificationPost(data),
                commentOn: {
                    publicationId: data.in_reply_to_status_id_str || '',
                    postId: data.in_reply_to_status_id_str || '',
                    type: 'Post',
                    source: Source.Twitter,
                    author: {
                        ...createDummyProfile(Source.Twitter),
                        profileId: data.in_reply_to_user_id_str || '',
                        handle: data.in_reply_to_screen_name || '',
                        fullHandle: data.in_reply_to_screen_name || '',
                    },
                    timestamp: Date.now(),
                    metadata: {
                        locale: 'en',
                        content: {},
                    },
                },
            },
            post: null, // parent post is not included in webhook
            timestamp: new Date(data.created_at).getTime(),
        } satisfies CommentNotification;
    }

    if (data.in_reply_to_user_id_str === viewerId) {
        // mention to viewer
        return {
            source: Source.Twitter,
            notificationId: `mention_${data.id_str}`,
            type: NotificationType.Mention,
            post: formatNotificationPost(data),
            timestamp: new Date(data.created_at).getTime(),
        } satisfies MentionNotification;
    }

    return null;
}

export function formatNotificationsFromWebhook(
    messages: MessagesResponse['messages'],
    viewerId: string,
): Notification[] {
    const notifications = compact(
        messages.map((message) => {
            if ('follow_events' in message) {
                const followEvent = first(message.follow_events);
                return followEvent ? formatFollowNotification(followEvent, viewerId) : null;
            }

            if ('favorite_events' in message) {
                const favoriteEvent = first(message.favorite_events);
                return favoriteEvent ? formatFavoriteNotification(favoriteEvent, viewerId) : null;
            }

            if ('tweet_create_events' in message) {
                const tweetCreateEvent = first(message.tweet_create_events);
                return tweetCreateEvent ? formatCreateTweetNotification(tweetCreateEvent, viewerId) : null;
            }

            return null;
        }),
    );

    return mergeNotifications(notifications);
}
