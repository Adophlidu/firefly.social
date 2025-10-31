import { safeUnreachable } from '@firefly/utils';

import { Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { formatFarcasterPostFromFirefly } from '@/providers/farcaster/formatFarcasterPostFromFirefly.js';
import { formatFarcasterProfileFromFirefly } from '@/providers/farcaster/formatFarcasterProfileFromFirefly.js';
import {
    type Notification as FireflyNotification,
    NotificationType as FireflyNotificationType,
} from '@/providers/types/Firefly.js';
import { type Notification, NotificationType } from '@/providers/types/SocialMedia.js';

export function formatFireflyNotification(profileId: string, notification: FireflyNotification): Notification | null {
    const notificationId = `${profileId}_${notification.timestamp}_${notification.notificationType}`;
    const users =
        notification.users?.map(formatFarcasterProfileFromFirefly) ??
        (notification.user ? [formatFarcasterProfileFromFirefly(notification.user)] : EMPTY_LIST);
    const post = notification.cast ? formatFarcasterPostFromFirefly(notification.cast) : undefined;
    const timestamp = notification.timestamp ? new Date(notification.timestamp).getTime() : undefined;

    switch (notification.notificationType) {
        case FireflyNotificationType.CastBeLiked:
            return {
                source: Source.Farcaster,
                notificationId,
                type: NotificationType.Reaction,
                reactors: users,
                post,
                timestamp,
            };
        case FireflyNotificationType.CastBeRecasted:
            return {
                source: Source.Farcaster,
                notificationId,
                type: NotificationType.Mirror,
                mirrors: users,
                post,
                timestamp,
            };
        case FireflyNotificationType.CastBeReplied:
            const commentOn = notification.cast?.parentCast
                ? formatFarcasterPostFromFirefly(notification.cast.parentCast)
                : undefined;
            return {
                source: Source.Farcaster,
                notificationId,
                type: NotificationType.Comment,
                comment: post
                    ? {
                          ...post,
                          commentOn,
                      }
                    : undefined,
                post: commentOn,
                timestamp,
            } as const;
        case FireflyNotificationType.BeFollowed:
            return {
                source: Source.Farcaster,
                notificationId,
                type: NotificationType.Follow,
                followers: users,
                timestamp,
            };
        case FireflyNotificationType.BeMentioned:
            return {
                source: Source.Farcaster,
                notificationId,
                type: NotificationType.Mention,
                post,
                timestamp,
            };
        case FireflyNotificationType.BeQuoted:
            return post?.quoteOn
                ? {
                      source: Source.Farcaster,
                      notificationId,
                      type: NotificationType.Quote,
                      post: post.quoteOn,
                      quote: post,
                      timestamp,
                  }
                : null;
        default:
            safeUnreachable(notification.notificationType);
            return null;
    }
}
