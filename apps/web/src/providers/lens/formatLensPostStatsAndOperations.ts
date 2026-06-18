import { SORTED_POLL_SOURCES } from '@dimensiondev/constants/computed';
import { Source } from '@dimensiondev/enums';
import { isSameEthereumAddress } from '@dimensiondev/web3/utils';
import {
    type LoggedInPostOperations,
    type PostAction,
    PostRuleUnsatisfiedReason,
    type PostStats,
} from '@lens-protocol/client';

import { ORB_POLL_CONTRACT } from '@/constants/poll.js';
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

    const rules = [...(outcome.unsatisfiedRules?.required ?? []), ...(outcome.unsatisfiedRules?.anyOf ?? [])];
    const clubRule = rules.find((rule) => rule.reason === PostRuleUnsatisfiedReason.FeedGroupGatedNotAMember);
    if (!clubRule) return { clubGated: false };

    const groupConfig = clubRule.config.find(
        (item): item is Extract<typeof item, { __typename: 'AddressKeyValue' }> =>
            item.__typename === 'AddressKeyValue' && (item.key === 'group' || item.key === 'groupAddress'),
    );

    return { clubGated: true, clubAddress: groupConfig?.address };
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
