import { SORTED_POLL_SOURCES } from '@dimensiondev/constants/computed';
import { Source } from '@dimensiondev/enums';
import { isSameEthereumAddress } from '@dimensiondev/web3/utils';
import type { LoggedInPostOperations, PostAction, PostStats } from '@lens-protocol/client';

import { ORB_POLL_CONTRACT } from '@/constants/poll.js';
import { resolveClubGateAddress } from '@/providers/lens/resolveClubGateAddress.js';
import type { Post, PostInteractionRestriction } from '@/providers/types/SocialMedia.js';

type PostOperationOutcome = LoggedInPostOperations['canComment'];

/**
 * Inspect a failed post-operation validation (reply/repost) and describe the
 * restriction so the UI can render a clear message instead of a raw rule error.
 * When the unsatisfied rule is a club (Lens group) membership gate, we surface
 * the group address so the user can join in place.
 */
export function resolvePostInteractionRestriction(
    outcome: PostOperationOutcome,
): PostInteractionRestriction | undefined {
    if (outcome.__typename !== 'PostOperationValidationFailed') return undefined;

    const clubAddress = resolveClubGateAddress(outcome.unsatisfiedRules);
    return clubAddress ? { clubGated: true, clubAddress } : { clubGated: false };
}

export function formatLensPostStats(stats: PostStats): NonNullable<Post['stats']> {
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
        | 'hasReported'
        | 'hasPoll'
    >
> &
    Pick<Post, 'replyRestriction' | 'repostRestriction'> {
    const canAct = actions?.some((action) => action.__typename === 'SimpleCollectAction') || false;
    const hasPoll =
        SORTED_POLL_SOURCES.includes(Source.Lens) &&
        !!actions?.length &&
        actions.some(
            (action) =>
                action.__typename === 'UnknownPostAction' && isSameEthereumAddress(action.address, ORB_POLL_CONTRACT),
        );

    if (!operations) {
        return {
            canComment: true,
            canMirror: true,
            canDecrypt: false,
            canAct,
            canQuote: true,

            hasMirrored: false,
            hasQuoted: false,
            hasActed: false,
            hasLiked: false,
            hasBookmarked: false,
            hasReported: false,
            hasPoll,
        };
    }

    return {
        canComment: operations.canComment.__typename === 'PostOperationValidationPassed',
        canMirror: operations.canRepost.__typename === 'PostOperationValidationPassed',
        replyRestriction: resolvePostInteractionRestriction(operations.canComment),
        repostRestriction: resolvePostInteractionRestriction(operations.canRepost),
        canDecrypt: false, // TODO
        canAct,
        canQuote: operations.canQuote.__typename === 'PostOperationValidationPassed',

        hasMirrored: operations.hasReposted.onChain,
        hasQuoted: operations.hasQuoted.onChain,
        hasActed: operations.hasSimpleCollected,
        hasLiked: operations.hasUpvoted,
        hasBookmarked: operations.hasBookmarked,
        hasReported: operations.hasReported,
        hasPoll,
    };
}
