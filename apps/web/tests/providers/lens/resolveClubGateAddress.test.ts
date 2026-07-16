import { PostRuleUnsatisfiedReason } from '@lens-protocol/client';
import { describe, expect, it } from 'vitest';

import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { resolveClubGateAddress } from '@/providers/lens/resolveClubGateAddress.js';

const GROUP_ADDRESS = '0x1234567890123456789012345678901234567890';
const RULE_ADDRESS = safeEvmAddress('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');

type UnsatisfiedRules = NonNullable<Parameters<typeof resolveClubGateAddress>[0]>;
type UnsatisfiedRule = UnsatisfiedRules['required'][number];

function unsatisfiedRules(required: UnsatisfiedRule[], anyOf: UnsatisfiedRule[] = []): UnsatisfiedRules {
    return { __typename: 'PostUnsatisfiedRules', required, anyOf };
}

function clubGatedRule(key: 'group' | 'groupAddress' = 'group'): UnsatisfiedRule {
    return {
        __typename: 'PostUnsatisfiedRule',
        rule: RULE_ADDRESS,
        reason: PostRuleUnsatisfiedReason.FeedGroupGatedNotAMember,
        message: 'Not a member',
        config: [{ __typename: 'AddressKeyValue', key, address: safeEvmAddress(GROUP_ADDRESS) }],
    };
}

describe('resolveClubGateAddress', () => {
    it('returns undefined when there are no unsatisfied rules', () => {
        expect(resolveClubGateAddress(undefined)).toBeUndefined();
        expect(resolveClubGateAddress(null)).toBeUndefined();
        expect(resolveClubGateAddress(unsatisfiedRules([]))).toBeUndefined();
    });

    it('extracts the group address from a required club-gate rule', () => {
        expect(resolveClubGateAddress(unsatisfiedRules([clubGatedRule('group')]))).toBe(safeEvmAddress(GROUP_ADDRESS));
    });

    it('extracts the group address from an anyOf club-gate rule', () => {
        expect(resolveClubGateAddress(unsatisfiedRules([], [clubGatedRule('groupAddress')]))).toBe(
            safeEvmAddress(GROUP_ADDRESS),
        );
    });

    it('returns undefined for non-club rule failures', () => {
        const rule: UnsatisfiedRule = {
            __typename: 'PostUnsatisfiedRule',
            rule: RULE_ADDRESS,
            reason: PostRuleUnsatisfiedReason.PostNotAFollower,
            message: 'Not a follower',
            config: [],
        };
        expect(resolveClubGateAddress(unsatisfiedRules([rule]))).toBeUndefined();
    });
});
