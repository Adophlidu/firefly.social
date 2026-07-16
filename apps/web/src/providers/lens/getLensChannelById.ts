import { runInSafeAsync } from '@dimensiondev/utils';
import { isSameEthereumAddress } from '@dimensiondev/web3/utils';

import { applyOptimisticLensChannelMembership } from '@/providers/lens/applyOptimisticLensChannelMembership.js';
import { getGroupWithMemberCount, getGroupWithOwner } from '@/providers/lens/getFullGroup.js';
import { getLensProfileById } from '@/providers/lens/getLensProfileById.js';
import { searchOrbLensClubs } from '@/providers/lens/getOrbLensClubs.js';
import { mergeOrbChannelMembership } from '@/providers/lens/resolveChannelMembershipStatus.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

async function mergeOrbMembership(channel: Channel, viewerProfileId?: string): Promise<Channel> {
    if (!viewerProfileId || channel.membershipStatus !== 'requestToJoin') return channel;

    const orbChannels = await runInSafeAsync(() => searchOrbLensClubs(channel.name || channel.id, viewerProfileId));
    const orbChannel = orbChannels?.find((item) => isSameEthereumAddress(item.id, channel.id));
    return mergeOrbChannelMembership(channel, orbChannel);
}

export async function getLensChannelById(
    channelId: string,
    ownerId?: string,
    viewerProfileId?: string,
): Promise<Channel> {
    if (ownerId) {
        const channel = await mergeOrbMembership(await getGroupWithOwner(channelId, ownerId), viewerProfileId);
        return applyOptimisticLensChannelMembership(channel, viewerProfileId);
    }
    const group = await getGroupWithMemberCount(channelId);
    const owner = group.ownerId ? await runInSafeAsync(() => getLensProfileById(group.ownerId!)) : undefined;

    const channel = await mergeOrbMembership({ ...group, lead: owner }, viewerProfileId);
    return applyOptimisticLensChannelMembership(channel, viewerProfileId);
}
