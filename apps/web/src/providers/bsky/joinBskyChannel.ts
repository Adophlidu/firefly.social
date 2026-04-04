import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { type Channel } from '@/providers/types/SocialMedia.js';

export async function joinBskyChannel(channel: Channel): Promise<boolean> {
    const response = await bskySessionHolder.agent.addSavedFeeds([
        {
            pinned: false,
            type: 'feed',
            value: channel.url,
        },
    ]);

    return !!response.find((x) => x.value === channel.url);
}
