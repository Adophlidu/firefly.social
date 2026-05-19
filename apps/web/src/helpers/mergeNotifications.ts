import { NotificationType, Source } from '@dimensiondev/enums';
import { last } from 'lodash-es';

import { isSamePost } from '@/helpers/isSamePost.js';
import { uniqProfiles } from '@/helpers/uniqProfiles.js';
import type {
    FollowNotification,
    MirrorNotification,
    Notification,
    Profile,
    ReactionNotification,
} from '@/providers/types/SocialMedia.js';

function isSameNotificationInType(a: Notification, b: Notification): boolean {
    if (a.type !== b.type || a.source !== b.source) return false;
    if (a.source === Source.Firefly || b.source === Source.Firefly) return false;

    if (a.type === NotificationType.Follow && b.type === NotificationType.Follow) {
        return true;
    }
    if (a.type === NotificationType.Reaction && b.type === NotificationType.Reaction) {
        return isSamePost(a.post, b.post);
    }
    if (a.type === NotificationType.Mirror && b.type === NotificationType.Mirror) {
        return isSamePost(a.post, b.post);
    }

    return false;
}

function mergeNotificationsByType(notifications: Notification[]): Notification[] {
    if (notifications.length < 2) return notifications;

    const firstNotification = notifications[0];
    if (firstNotification.source === Source.Firefly) return notifications;

    switch (firstNotification.type) {
        case NotificationType.Follow: {
            const mergedFollowers = notifications.reduce<Profile[]>((acc, notification) => {
                if (notification.type === NotificationType.Follow && notification.source !== Source.Firefly) {
                    acc.push(...notification.followers);
                }
                return acc;
            }, []);
            return [
                {
                    ...firstNotification,
                    followers: uniqProfiles(mergedFollowers),
                } satisfies FollowNotification,
            ];
        }
        case NotificationType.Reaction: {
            const mergedReactors = notifications.reduce<Profile[]>((acc, notification) => {
                if (notification.type === NotificationType.Reaction && notification.source !== Source.Firefly) {
                    acc.push(...notification.reactors);
                }
                return acc;
            }, []);
            return [
                {
                    ...firstNotification,
                    reactors: uniqProfiles(mergedReactors),
                } satisfies ReactionNotification,
            ];
        }
        case NotificationType.Mirror: {
            const mergedMirrors = notifications.reduce<Profile[]>((acc, notification) => {
                if (notification.type === NotificationType.Mirror && notification.source !== Source.Firefly) {
                    acc.push(...notification.mirrors);
                }
                return acc;
            }, []);
            return [
                {
                    ...firstNotification,
                    mirrors: uniqProfiles(mergedMirrors),
                } satisfies MirrorNotification,
            ];
        }
        default:
            return notifications;
    }
}

/**
 * merge social media notifications of the same type
 */
export function mergeNotifications(notifications: Notification[]) {
    if (notifications.length < 2) return notifications;

    const mergedNotifications: Notification[] = [];
    const sameNotifications: Notification[] = [];

    for (const current of notifications) {
        const lastChecked = last(sameNotifications);
        if (!lastChecked) {
            sameNotifications.push(current);
            continue;
        }

        if (isSameNotificationInType(lastChecked, current)) {
            sameNotifications.push(current);
        } else {
            const merged = mergeNotificationsByType(sameNotifications);
            mergedNotifications.push(...merged);
            sameNotifications.length = 0;
            sameNotifications.push(current);
        }
    }

    const merged = mergeNotificationsByType(sameNotifications);
    mergedNotifications.push(...merged);

    return mergedNotifications;
}
