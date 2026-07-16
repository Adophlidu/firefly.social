import type { LoggedInPostOperations, PostResult } from '@lens-protocol/client';
import { PostRuleUnsatisfiedReason } from '@lens-protocol/client';

type CanCommentValidationFailed = Extract<
    LoggedInPostOperations['canComment'],
    { __typename: 'PostOperationValidationFailed' }
>;
type PostResultValidationFailed = Extract<PostResult, { __typename: 'PostOperationValidationFailed' }>;

type UnsatisfiedRules = CanCommentValidationFailed['unsatisfiedRules'] | PostResultValidationFailed['unsatisfiedRules'];

/**
 * Extract the Lens group (club) address from a post operation's unsatisfied
 * rules, when the failure is a club-membership gate. Shared by the
 * canComment/canRepost check on existing posts and the post-creation failure
 * path (new posts/replies/quotes) — both surface the same generated rule shape.
 */
export function resolveClubGateAddress(unsatisfiedRules: UnsatisfiedRules | null | undefined) {
    const rules = [...(unsatisfiedRules?.required ?? []), ...(unsatisfiedRules?.anyOf ?? [])];
    const clubRule = rules.find((rule) => rule.reason === PostRuleUnsatisfiedReason.FeedGroupGatedNotAMember);
    if (!clubRule) return undefined;

    const groupConfig = clubRule.config.find(
        (item): item is Extract<typeof item, { __typename: 'AddressKeyValue' }> =>
            item.__typename === 'AddressKeyValue' && (item.key === 'group' || item.key === 'groupAddress'),
    );
    return groupConfig?.address;
}
