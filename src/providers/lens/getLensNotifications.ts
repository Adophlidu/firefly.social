import { fetchNotifications } from '@lens-protocol/client/actions';
import { compact, first, flatMap } from 'lodash-es';

import { Source } from '@/constants/enum.js';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { uniqProfiles } from '@/helpers/uniqProfiles.js';
import { ensureCursor } from '@/providers/lens/ensureCursor.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { filterNotifications } from '@/providers/lens/filterNotifications.js';
import { formatLensPostV3, formatLensQuoteOrCommentV3 } from '@/providers/lens/formatLensPost.js';
import { formatLensProfileV3 } from '@/providers/lens/formatLensProfile.js';
import { isMutedLensAccount } from '@/providers/lens/isMutedLensAccount.js';
import {
    isAccountActionExecutedNotification,
    isCommentNotification,
    isFollowNotification,
    isGroupMembershipRequestApprovedNotification,
    isGroupMembershipRequestRejectedNotification,
    isMentionNotification,
    isPostActionExecutedNotification,
    isQuoteNotification,
    isReactionNotification,
    isRepostNotification,
} from '@/providers/lens/isNotification.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';
import { type Notification, NotificationType, ReactionType } from '@/providers/types/SocialMedia.js';

export async function getLensNotifications(
    indicator?: PageIndicator,
    highSignalFilter?: boolean,
): Promise<Pageable<Notification, PageIndicator>> {
    const result = await ensureLensResult(
        fetchNotifications(lensSessionClientHolder.sessionClient, {
            cursor: ensureCursor(indicator),
            filter: {
                includeLowScore: !highSignalFilter,
            },
        }),
    );

    const data = filterNotifications(result.items).map<Notification | null>((item) => {
        if (isRepostNotification(item)) {
            if (!item.reposts.length) return null;
            if (item.reposts.some((x) => isMutedLensAccount(x.account))) return null;

            const time = first(item.reposts)?.repostedAt;
            const post = formatLensQuoteOrCommentV3(item.post);
            if (!post) return null;

            return {
                source: Source.Lens,
                notificationId: item.id,
                type: NotificationType.Mirror,
                mirrors: uniqProfiles(item.reposts.map((x) => formatLensProfileV3(x.account))),
                post,
                timestamp: time ? new Date(time).getTime() : undefined,
            };
        }

        if (isQuoteNotification(item)) {
            if (isMutedLensAccount(item.quote.author)) return null;

            const time = item.quote.timestamp;
            const quoteOf = formatLensQuoteOrCommentV3(item.quote.quoteOf, 'Quote');
            if (!quoteOf) return null;

            return {
                source: Source.Lens,
                notificationId: item.id,
                type: NotificationType.Quote,
                quote: formatLensPostV3(item.quote),
                post: quoteOf,
                timestamp: time ? new Date(time).getTime() : undefined,
            };
        }

        if (isReactionNotification(item)) {
            if (!item.reactions.length) return null;
            if (item.reactions.some((x) => isMutedLensAccount(x.account))) return null;

            const time = first(flatMap(item.reactions.map((x) => x.reactions)))?.reactedAt;
            const post = formatLensQuoteOrCommentV3(item.post);
            if (!post) return null;

            return {
                source: Source.Lens,
                notificationId: item.id,
                type: NotificationType.Reaction,
                reaction: ReactionType.Upvote,
                reactors: uniqProfiles(item.reactions.map((x) => formatLensProfileV3(x.account))),
                post,
                timestamp: time ? new Date(time).getTime() : undefined,
            };
        }

        if (isCommentNotification(item)) {
            if (isMutedLensAccount(item.comment.author)) return null;

            const commentOn = formatLensQuoteOrCommentV3(item.comment.commentOn, 'Comment');
            if (!commentOn) return null;

            return {
                source: Source.Lens,
                notificationId: item.id,
                type: NotificationType.Comment,
                comment: formatLensPostV3(item.comment),
                post: commentOn,
                timestamp: new Date(item.comment.timestamp).getTime(),
            };
        }

        if (isFollowNotification(item)) {
            if (!item.followers.length) return null;
            if (item.followers.some((x) => isMutedLensAccount(x.account))) return null;

            return {
                source: Source.Lens,
                notificationId: item.id,
                type: NotificationType.Follow,
                followers: uniqProfiles(item.followers.map((x) => formatLensProfileV3(x.account))),
            };
        }

        if (isMentionNotification(item)) {
            if (isMutedLensAccount(item.post.author)) return null;

            const post = formatLensQuoteOrCommentV3(item.post);
            if (!post) return null;

            return {
                source: Source.Lens,
                notificationId: item.id,
                type: NotificationType.Mention,
                post,
                timestamp: new Date(item.post.timestamp).getTime(),
            };
        }

        if (isAccountActionExecutedNotification(item)) {
            return null;
        }

        if (isGroupMembershipRequestApprovedNotification(item)) {
            return null;
        }

        if (isGroupMembershipRequestRejectedNotification(item)) {
            return null;
        }

        if (isPostActionExecutedNotification(item)) {
            return null;
        }

        return null;
    });

    return createPageable(
        compact(data),
        createIndicator(indicator),
        result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
    );
}
