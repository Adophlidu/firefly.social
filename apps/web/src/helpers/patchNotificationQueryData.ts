import { safeUnreachable } from '@dimensiondev/utils';
import { type Draft, produce } from 'immer';
import { first } from 'lodash-es';

import { queryClient } from '@/configs/queryClient.js';
import { UNIFIED_NOTIFICATION_TYPES } from '@/constants/computed.js';
import type { Source } from '@/constants/enum.js';
import type { ScheduleNotification, TipsNotification, UnifiedNotification } from '@/providers/types/Firefly.js';
import { type Notification, NotificationType, type Post, type Profile } from '@/providers/types/SocialMedia.js';

type Patcher = (old: Draft<Notification>) => void;
type SocialNotification = Exclude<Notification, UnifiedNotification | TipsNotification | ScheduleNotification>;

function shouldSkipNotification(notification: Notification) {
    return (
        notification.type === NotificationType.Tips ||
        notification.type === NotificationType.Schedule ||
        UNIFIED_NOTIFICATION_TYPES.includes(notification.type as NotificationType)
    );
}

export function patchNotificationQueryData(_source: Source, patcher: Patcher) {
    queryClient.setQueriesData<{ pages: Array<{ data: Notification[] }> }>({ queryKey: ['notifications'] }, (old) => {
        if (!old) return old;

        return produce(old, (draft) => {
            draft.pages.forEach((page) => {
                page.data.forEach(patcher);
            });
        });
    });
}

type PostPatcher = (old: Draft<Post>) => void;

export function patchNotificationQueryDataOnPost(_source: Source, patcher: PostPatcher) {
    patchNotificationQueryData(_source, (notification) => {
        if (shouldSkipNotification(notification)) return;

        // Only these these types have interaction.
        let target: Post | undefined = undefined;
        const type = notification.type;
        const notif = notification as SocialNotification;
        switch (type) {
            case NotificationType.Comment: {
                const commentNotif = notif as Extract<SocialNotification, { type: NotificationType.Comment }>;
                if (commentNotif.comment) {
                    target = commentNotif.comment;
                }
                break;
            }
            case NotificationType.Mention: {
                const mentionNotif = notif as Extract<SocialNotification, { type: NotificationType.Mention }>;
                if (mentionNotif.post) {
                    target = mentionNotif.post;
                }
                break;
            }
            case NotificationType.Quote: {
                const quoteNotif = notif as Extract<SocialNotification, { type: NotificationType.Quote }>;
                target = quoteNotif.quote;
                break;
            }
            case NotificationType.Act:
            case NotificationType.Mirror:
            case NotificationType.Reaction: {
                const postNotif = notif as Extract<
                    SocialNotification,
                    { type: NotificationType.Act | NotificationType.Mirror | NotificationType.Reaction }
                >;
                if (postNotif.post) {
                    target = postNotif.post;
                }
                break;
            }
            case NotificationType.Follow:
            case NotificationType.Tips:
            case NotificationType.Schedule:
            case NotificationType.LikeMatters:
            case NotificationType.LikeMirror:
            case NotificationType.LikeParagraph:
            case NotificationType.LikeLimo:
            case NotificationType.LikeBets:
            case NotificationType.LikeDAO:
            case NotificationType.LikeNFT:
                break;
            default:
                safeUnreachable(type);
                return;
        }

        if (target) {
            patcher(target);
        }
    });
}

type ProfilePatcher = (old: Draft<Profile>) => void;

export function patchNotificationQueryDataOnAuthor(_source: Source, patcher: ProfilePatcher) {
    patchNotificationQueryData(_source, (notification) => {
        if (shouldSkipNotification(notification)) return;

        let target: Profile | undefined = undefined;
        const type = notification.type;
        const notif = notification as SocialNotification;
        switch (type) {
            case NotificationType.Comment: {
                const commentNotif = notif as Extract<SocialNotification, { type: NotificationType.Comment }>;
                if (commentNotif.comment) {
                    target = commentNotif.comment.author;
                }
                break;
            }
            case NotificationType.Mention:
            case NotificationType.Quote:
            case NotificationType.Act: {
                const postNotif = notif as Extract<
                    SocialNotification,
                    { type: NotificationType.Mention | NotificationType.Quote | NotificationType.Act }
                >;
                if (postNotif.post) {
                    target = postNotif.post.author;
                }
                break;
            }
            case NotificationType.Follow: {
                const followNotif = notif as Extract<SocialNotification, { type: NotificationType.Follow }>;
                target = first(followNotif.followers);
                break;
            }
            case NotificationType.Mirror: {
                const mirrorNotif = notif as Extract<SocialNotification, { type: NotificationType.Mirror }>;
                target = first(mirrorNotif.mirrors);
                break;
            }
            case NotificationType.Reaction: {
                const reactionNotif = notif as Extract<SocialNotification, { type: NotificationType.Reaction }>;
                target = first(reactionNotif.reactors);
                break;
            }
            case NotificationType.Tips:
            case NotificationType.Schedule:
            case NotificationType.LikeMatters:
            case NotificationType.LikeMirror:
            case NotificationType.LikeParagraph:
            case NotificationType.LikeLimo:
            case NotificationType.LikeBets:
            case NotificationType.LikeDAO:
            case NotificationType.LikeNFT:
                break;
            default:
                safeUnreachable(type);
                return;
        }

        if (target) {
            patcher(target);
        }
    });
}
