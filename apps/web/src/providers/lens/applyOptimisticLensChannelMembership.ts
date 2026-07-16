import { Source } from '@dimensiondev/enums';

import type { Channel } from '@/providers/types/SocialMedia.js';
import { useJoinedChannelStore } from '@/store/useJoinedChannelStore.js';

/**
 * Keep a confirmed Lens join visible while the Lens and Orb indexers still
 * return the pre-join membership state.
 */
export function applyOptimisticLensChannelMembership(channel: Channel, profileId?: string): Channel {
    if (
        channel.source !== Source.Lens ||
        channel.isMember ||
        channel.membershipStatus === 'joined' ||
        !useJoinedChannelStore.getState().hasJoined(profileId, channel.id)
    ) {
        return channel;
    }

    return {
        ...channel,
        membershipStatus: 'joined',
        isMember: true,
        canJoin: false,
        canLeave: true,
    };
}

export function applyOptimisticLensChannelMemberships(channels: Channel[], profileId?: string): Channel[] {
    return channels.map((channel) => applyOptimisticLensChannelMembership(channel, profileId));
}
