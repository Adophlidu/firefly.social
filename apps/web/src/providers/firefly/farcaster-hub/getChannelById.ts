import { SessionType } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';

import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { getChannelByHandle } from '@/providers/firefly/farcaster-hub/getChannelByHandle.js';
import type { Channel } from '@/providers/types/SocialMedia.js';
import { getChannelFollowStatus } from '@/providers/warpcast/getChannelFollowStatus.js';

export async function getChannelById(channelId: string, includeFollowingStatus?: boolean): Promise<Channel> {
    const channel = await getChannelByHandle(channelId);
    if (!includeFollowingStatus) return channel;

    const session = getSessionFromStorage(SessionType.Farcaster);
    if (!session?.profileId) return channel;

    const following = await runInSafeAsync(() => getChannelFollowStatus(channelId, session.profileId));
    channel.isMember = following ?? false;

    return channel;
}
