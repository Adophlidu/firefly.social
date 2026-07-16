import { type Group, GroupRuleUnsatisfiedReason, type LoggedInGroupOperations } from '@lens-protocol/client';

import type { OrbClubConfig, OrbClubOperations } from '@/providers/orb/type.js';
import type { Channel, ChannelMembershipStatus } from '@/providers/types/SocialMedia.js';

export function resolveOrbClubMembershipStatus(
    operations?: OrbClubOperations,
    config?: OrbClubConfig,
): ChannelMembershipStatus {
    if (operations?.isMember) return 'joined';
    if (operations?.hasRequestedToJoin) return 'pendingRequest';
    if (operations?.isBlocked || operations?.isEligible === false) return 'notEligible';
    if (operations?.isAcceptedOrInvitedToJoin) return 'join';
    if (operations?.hasBeenRejected) return 'pendingRequestRejected';
    if (config?.requestToJoinEnabled) return 'requestToJoin';
    return 'join';
}

function requiresMembershipApproval(operations?: LoggedInGroupOperations) {
    const canJoin = operations?.canJoin;
    return (
        canJoin?.__typename === 'GroupOperationValidationFailed' &&
        canJoin.unsatisfiedRules?.required.some(
            (rule) => rule.reason === GroupRuleUnsatisfiedReason.MembershipApprovalRequired,
        )
    );
}

export function resolveLensGroupMembershipStatus(
    group: Pick<Group, 'membershipApprovalEnabled' | 'operations'>,
): ChannelMembershipStatus {
    const operations = group.operations ?? undefined;
    if (operations?.isMember) return 'joined';
    if (operations?.isBanned) return 'notEligible';
    if (group.membershipApprovalEnabled || requiresMembershipApproval(operations)) return 'requestToJoin';
    if (!operations || operations.canJoin.__typename === 'GroupOperationValidationPassed') return 'join';
    return 'notEligible';
}

export function resolveChannelMembershipStatus(channel: Channel): ChannelMembershipStatus {
    if (channel.isMember) return 'joined';
    return channel.membershipStatus ?? (channel.canJoin === false ? 'notEligible' : 'join');
}

export function mergeOrbChannelMembership(channel: Channel, orbChannel?: Channel): Channel {
    if (!orbChannel) return channel;
    return {
        ...channel,
        membershipStatus: orbChannel.membershipStatus,
        isMember: orbChannel.isMember,
        canJoin: orbChannel.canJoin,
        canLeave: orbChannel.canLeave,
    };
}

export function canRequestLensClubMembership(channel: Channel) {
    const status = resolveChannelMembershipStatus(channel);
    return status === 'join' || status === 'requestToJoin' || status === 'pendingRequestRejected';
}

export function resolveLensClubJoinAction(channel: Channel): 'join' | 'request' | null {
    const status = resolveChannelMembershipStatus(channel);
    if (status === 'requestToJoin' || status === 'pendingRequestRejected') return 'request';
    if (status === 'join') return 'join';
    return null;
}
