import { PostRuleUnsatisfiedReason } from '@lens-protocol/client';
import { describe, expect, it } from 'vitest';

import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { resolvePostInteractionRestriction } from '@/providers/lens/formatLensPostStatsAndOperations.js';

type Outcome = Parameters<typeof resolvePostInteractionRestriction>[0];
type FailedOutcome = Extract<Outcome, { __typename: 'PostOperationValidationFailed' }>;
type UnsatisfiedRule = NonNullable<FailedOutcome['unsatisfiedRules']>['required'][number];

const GROUP_ADDRESS = '0x1234567890123456789012345678901234567890';

function failedOutcome(required: UnsatisfiedRule[]): FailedOutcome {
    return {
        __typename: 'PostOperationValidationFailed',
        reason: 'Not all rules satisfied',
        unsatisfiedRules: {
            __typename: 'PostUnsatisfiedRules',
            required,
            anyOf: [],
        },
    };
}

function clubGatedRule(): UnsatisfiedRule {
    return {
        __typename: 'PostUnsatisfiedRule',
        rule: safeEvmAddress('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
        reason: PostRuleUnsatisfiedReason.FeedGroupGatedNotAMember,
        message: 'Not a member',
        config: [
            {
                __typename: 'AddressKeyValue',
                key: 'group',
                address: safeEvmAddress(GROUP_ADDRESS),
            },
        ],
    };
}

describe('resolvePostInteractionRestriction', () => {
    it('returns undefined when the operation is allowed', () => {
        expect(resolvePostInteractionRestriction({ __typename: 'PostOperationValidationPassed' })).toBeUndefined();
    });

    it('flags a club gate and extracts the group address', () => {
        expect(resolvePostInteractionRestriction(failedOutcome([clubGatedRule()]))).toEqual({
            clubGated: true,
            clubAddress: safeEvmAddress(GROUP_ADDRESS),
        });
    });

    it('treats non-club rule failures as a generic restriction', () => {
        const rule: UnsatisfiedRule = {
            __typename: 'PostUnsatisfiedRule',
            rule: safeEvmAddress('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'),
            reason: PostRuleUnsatisfiedReason.PostNotAFollower,
            message: 'Not a follower',
            config: [],
        };
        expect(resolvePostInteractionRestriction(failedOutcome([rule]))).toEqual({ clubGated: false });
    });
});
