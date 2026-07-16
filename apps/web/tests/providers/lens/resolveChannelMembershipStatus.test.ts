import { Source } from '@dimensiondev/enums';
import { GroupRuleUnsatisfiedReason } from '@lens-protocol/client';
import { describe, expect, it } from 'vitest';

import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import {
    mergeOrbChannelMembership,
    resolveChannelMembershipStatus,
    resolveLensClubJoinAction,
    resolveLensGroupMembershipStatus,
    resolveOrbClubMembershipStatus,
} from '@/providers/lens/resolveChannelMembershipStatus.js';
import type { Channel, ChannelMembershipStatus } from '@/providers/types/SocialMedia.js';

type GroupInput = Parameters<typeof resolveLensGroupMembershipStatus>[0];
type Operations = NonNullable<GroupInput['operations']>;
type FailedCanJoin = Extract<Operations['canJoin'], { __typename: 'GroupOperationValidationFailed' }>;
type UnsatisfiedRule = NonNullable<FailedCanJoin['unsatisfiedRules']>['required'][number];

function operations(
    canJoin: Operations['canJoin'],
    overrides: Partial<Pick<Operations, 'isBanned' | 'isMember'>> = {},
): Operations {
    const validationPassed = { __typename: 'GroupOperationValidationPassed' } as const;
    return {
        __typename: 'LoggedInGroupOperations',
        id: 'operations',
        canJoin,
        canLeave: validationPassed,
        canAddMember: validationPassed,
        canRemoveMember: validationPassed,
        isBanned: false,
        isMember: false,
        ...overrides,
    };
}

function approvalRequired(): FailedCanJoin {
    const rule: UnsatisfiedRule = {
        __typename: 'GroupUnsatisfiedRule',
        rule: safeEvmAddress('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
        reason: GroupRuleUnsatisfiedReason.MembershipApprovalRequired,
        message: 'Membership approval required',
        config: [],
    };
    return {
        __typename: 'GroupOperationValidationFailed',
        reason: 'Not all rules satisfied',
        unsatisfiedRules: {
            __typename: 'GroupUnsatisfiedRules',
            required: [rule],
            anyOf: [],
        },
    };
}

function channel(membershipStatus: ChannelMembershipStatus): Channel {
    return {
        source: Source.Lens,
        id: '0x1234567890123456789012345678901234567890',
        name: 'Club',
        imageUrl: '',
        url: '',
        parentUrl: '',
        followerCount: 1,
        timestamp: 0,
        membershipStatus,
    };
}

describe('resolveOrbClubMembershipStatus', () => {
    it.each([
        [{ isMember: true, hasRequestedToJoin: true }, {}, 'joined'],
        [{ hasRequestedToJoin: true, isEligible: false }, {}, 'pendingRequest'],
        [{ isBlocked: true, hasBeenRejected: true }, {}, 'notEligible'],
        [{ isEligible: false }, {}, 'notEligible'],
        [{ isEligible: true, isAcceptedOrInvitedToJoin: true }, { requestToJoinEnabled: true }, 'join'],
        [{ hasBeenRejected: true }, { requestToJoinEnabled: true }, 'pendingRequestRejected'],
        [{ isEligible: true }, { requestToJoinEnabled: true }, 'requestToJoin'],
        [{ isEligible: true }, {}, 'join'],
    ] as const)('maps operations and config to %s', (operations, config, expected) => {
        expect(resolveOrbClubMembershipStatus(operations, config)).toBe(expected);
    });
});

describe('resolveLensGroupMembershipStatus', () => {
    it('prefers existing membership over approval configuration', () => {
        expect(
            resolveLensGroupMembershipStatus({
                membershipApprovalEnabled: true,
                operations: operations({ __typename: 'GroupOperationValidationPassed' }, { isMember: true }),
            }),
        ).toBe('joined');
    });

    it('maps approval configuration and approval validation failures to requestToJoin', () => {
        expect(
            resolveLensGroupMembershipStatus({
                membershipApprovalEnabled: true,
                operations: operations({ __typename: 'GroupOperationValidationPassed' }),
            }),
        ).toBe('requestToJoin');
        expect(
            resolveLensGroupMembershipStatus({
                membershipApprovalEnabled: false,
                operations: operations(approvalRequired()),
            }),
        ).toBe('requestToJoin');
    });

    it('maps banned and other failed validations to notEligible', () => {
        expect(
            resolveLensGroupMembershipStatus({
                membershipApprovalEnabled: false,
                operations: operations({ __typename: 'GroupOperationValidationPassed' }, { isBanned: true }),
            }),
        ).toBe('notEligible');
        expect(
            resolveLensGroupMembershipStatus({
                membershipApprovalEnabled: false,
                operations: operations({ ...approvalRequired(), unsatisfiedRules: null }),
            }),
        ).toBe('notEligible');
    });
});

describe('Lens club action routing', () => {
    it.each([
        ['join', 'join'],
        ['pendingRequestRejected', 'request'],
        ['requestToJoin', 'request'],
        ['joined', null],
        ['pendingRequest', null],
        ['notEligible', null],
    ] as const)('routes %s to %s', (status, action) => {
        expect(resolveLensClubJoinAction(channel(status))).toBe(action);
    });

    it('treats isMember as authoritative over stale explicit state', () => {
        expect(resolveChannelMembershipStatus({ ...channel('requestToJoin'), isMember: true })).toBe('joined');
    });
});

describe('mergeOrbChannelMembership', () => {
    it('uses Orb pending state over Lens approval inference', () => {
        const lensChannel = { ...channel('requestToJoin'), canJoin: true };
        const orbChannel = { ...channel('pendingRequest'), canJoin: false };

        expect(mergeOrbChannelMembership(lensChannel, orbChannel)).toMatchObject({
            membershipStatus: 'pendingRequest',
            canJoin: false,
        });
    });

    it('preserves Lens data when the Orb club is unavailable', () => {
        const lensChannel = channel('requestToJoin');
        expect(mergeOrbChannelMembership(lensChannel)).toBe(lensChannel);
    });
});
