import { Source } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';

import { HOME_CLUB } from '@/constants/channel.js';
import { isSameChannel } from '@/helpers/isSameChannel.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
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
export async function getLensPostRestrictionChannel(
    channels: LensChannelSelection[],
    profileId?: string,
): Promise<Channel | undefined> {
    for (const { channel, enabled } of channels) {
        if (!enabled) continue;
        if (!channel || isSameChannel(channel, HOME_CLUB)) continue;
        if (resolveChannelMembershipStatus(channel) === 'joined') continue;
        if (!profileId) return channel;

        // revalidate the channel membership status in case the user has joined it since the last fetch
        const refreshedChannel = await runInSafeAsync(() =>
            resolveSocialMediaProvider(Source.Lens).getChannelById(channel.id, true, channel.ownerId, profileId),
        );
        if (!refreshedChannel) return channel;
        if (resolveChannelMembershipStatus(refreshedChannel) !== 'joined') return refreshedChannel;
    }

    return undefined;
}
