import type {
    AccountActionExecutedNotification,
    FollowNotification,
    FragmentOf,
    GroupMembershipRequestApprovedNotification,
    GroupMembershipRequestRejectedNotification,
    MentionNotification,
    Post,
    PostActionExecutedNotification,
    ReactionNotification,
    RepostNotification,
} from '@lens-protocol/client';

import type { CommentNotificationFragment } from '@/providers/lens/fragments/notification/CommentNotification.js';
import type { QuoteNotificationFragment } from '@/providers/lens/fragments/notification/QuoteNotification.js';

function isNotification<
    T extends {
        __typename: unknown;
    },
>(typename: T['__typename']): (x: unknown) => x is T {
    return (x: unknown): x is T => {
        if (!x) return false;
        if (typeof x !== 'object') return false;
        if (!('__typename' in x)) return false;
        return (x as { __typename: string }).__typename === typename;
    };
}

type QuoteNotification = FragmentOf<typeof QuoteNotificationFragment> & {
    quote: Post;
};
type CommentNotification = FragmentOf<typeof CommentNotificationFragment> & {
    comment: Post;
};

export const isRepostNotification = isNotification<RepostNotification>('RepostNotification');
export const isQuoteNotification = isNotification<QuoteNotification>('QuoteNotification');
export const isReactionNotification = isNotification<ReactionNotification>('ReactionNotification');
export const isCommentNotification = isNotification<CommentNotification>('CommentNotification');
export const isFollowNotification = isNotification<FollowNotification>('FollowNotification');
export const isMentionNotification = isNotification<MentionNotification>('MentionNotification');
export const isAccountActionExecutedNotification = isNotification<AccountActionExecutedNotification>(
    'AccountActionExecutedNotification',
);
export const isGroupMembershipRequestApprovedNotification = isNotification<GroupMembershipRequestApprovedNotification>(
    'GroupMembershipRequestApprovedNotification',
);
export const isGroupMembershipRequestRejectedNotification = isNotification<GroupMembershipRequestRejectedNotification>(
    'GroupMembershipRequestRejectedNotification',
);
export const isPostActionExecutedNotification = isNotification<PostActionExecutedNotification>(
    'PostActionExecutedNotification',
);
