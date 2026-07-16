import { resolveChannelMembershipStatus } from '@/providers/lens/resolveChannelMembershipStatus.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

interface LensChannelSelection {
    channel: Channel | null;
    enabled: boolean;
}

/**
 * Return the channel that user cannot post to because they are not a member of it
 * @param channels all channels
 * @returns the first channel not joined
 */
export function getLensPostRestrictionChannel(channels: LensChannelSelection[]): Channel | undefined {
    for (const { channel, enabled } of channels) {
        if (!enabled) continue;
        if (channel && resolveChannelMembershipStatus(channel) !== 'joined') return channel;
    }

    return undefined;
}
