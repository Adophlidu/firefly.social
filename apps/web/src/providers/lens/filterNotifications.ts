import { isSameEthereumAddress } from '@dimensiondev/web3-utils';
import type { Notification as LensNotification } from '@lens-protocol/client';

import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { SessionType } from '@/providers/types/SocialMedia.js';

// filter thread notifications created by the current profile
export function filterNotifications(notifications: readonly LensNotification[]) {
    const session = getSessionFromStorage(SessionType.Lens);
    if (!session) return [];

    let lastCommentId: string | undefined;
    return notifications.reduce<LensNotification[]>((acc, item, index) => {
        if (
            item.__typename !== 'CommentNotification' ||
            !isSameEthereumAddress(item.comment.author.address, session.profileId)
        ) {
            lastCommentId = undefined;
            return acc.concat(item);
        }

        if (!lastCommentId) {
            const next = notifications[index + 1];
            const parentId = item.id.split('_')[2];
            if (
                next?.__typename === 'CommentNotification' &&
                isSameEthereumAddress(next.comment.author.address, session.profileId) &&
                next.comment.id === parentId
            ) {
                lastCommentId = parentId;
                return acc;
            }
        } else if (item.comment.id === lastCommentId) {
            lastCommentId = item.id.split('_')[2];
            return acc;
        } else {
            lastCommentId = undefined;
        }

        return acc.concat(item);
    }, []);
}
