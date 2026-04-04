import { isServer } from '@tanstack/react-query';

import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { ChannelAtUri } from '@/providers/bsky/AtUri.js';
import { formatBskyChannel } from '@/providers/bsky/formatBskyChannel.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { type Channel } from '@/providers/types/SocialMedia.js';

export async function getBskyChannelById(
    channelId: string,
    includeFollowingStatus?: boolean,
    signal?: AbortSignal,
): Promise<Channel> {
    const atUri = ChannelAtUri.fromId(channelId).toUri();
    const response = await bskySessionHolder.agent.app.bsky.feed.getFeedGenerator(
        {
            feed: atUri,
        },
        { signal },
    );
    const data = resolveBskyResponseData(response, 'Failed to query channel.');
    const channel = formatBskyChannel(data.view);
    if (isServer) return channel;

    const session = getSessionFromStorage(SessionType.Bsky);
    if (session?.profileId && includeFollowingStatus) {
        const response = await runInSafeAsync(() => bskySessionHolder.agent.getPreferences(), { signal });
        channel.isMember = response?.savedFeeds.some((x) => x.value === channel.url);
    }

    return channel;
}
