import type { LoggedInPostOperations, PostAction, PostStats } from '@lens-protocol/client';

import type { Post } from '@/providers/types/SocialMedia.js';

export function formatLensPostStats(stats: PostStats): Required<Post['stats']> {
    return {
        comments: stats.comments,
        mirrors: stats.reposts,
        quotes: stats.quotes,
        reactions: stats.upvotes,
        bookmarks: stats.bookmarks,
        countOpenActions: stats.collects,
    };
}

export function formatLensPostOperations(
    operations?: LoggedInPostOperations | null,
    actions?: PostAction[] | null,
): Required<
    Pick<
        Post,
        | 'canComment'
        | 'canMirror'
        | 'canDecrypt'
        | 'canAct'
        | 'hasMirrored'
        | 'hasQuoted'
        | 'hasActed'
        | 'hasLiked'
        | 'hasBookmarked'
        | 'canQuote'
    >
> {
    const canAct = actions?.some((action) => action.__typename === 'SimpleCollectAction') || false;

    if (!operations) {
        return {
            canComment: true,
            canMirror: true,
            canDecrypt: false, // TODO
            canAct,
            canQuote: true,

            hasMirrored: false,
            hasQuoted: false,
            hasActed: false,
            hasLiked: false,
            hasBookmarked: false,
        };
    }

    return {
        canComment: operations.canComment.__typename === 'PostOperationValidationPassed',
        canMirror: operations.canRepost.__typename === 'PostOperationValidationPassed',
        canDecrypt: false, // TODO
        canAct,
        canQuote: operations.canQuote.__typename === 'PostOperationValidationPassed',

        hasMirrored: operations.hasReposted.onChain,
        hasQuoted: operations.hasQuoted.onChain,
        hasActed: operations.hasSimpleCollected,
        hasLiked: operations.hasUpvoted,
        hasBookmarked: operations.hasBookmarked,
    };
}
