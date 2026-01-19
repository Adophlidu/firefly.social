import { ChannelAtUri } from '@/providers/bsky/AtUri.js';
import { formatBskyChannel } from '@/providers/bsky/formatBskyChannel.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { type Channel } from '@/providers/types/SocialMedia.js';

export async function getBskyChannelsByIds(ids: string[]): Promise<Channel[]> {
    const response = await bskySessionHolder.agent.app.bsky.feed.getFeedGenerators({
        feeds: ids.map((id) => ChannelAtUri.fromId(id).toUri()),
    });
    const data = resolveBskyResponseData(response, `Failed to get channels ids = ${ids.join(',')}.`);
    return data.feeds.map(formatBskyChannel);
}
