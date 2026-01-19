import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { type Channel } from '@/providers/types/SocialMedia.js';

export async function leaveBskyChannel(channel: Channel): Promise<boolean> {
    const response = await bskySessionHolder.agent.getPreferences();
    const result = response.savedFeeds.find((x) => x.value === channel.url);
    if (!result) return false;

    await bskySessionHolder.agent.overwriteSavedFeeds(response.savedFeeds.filter((x) => x.value !== channel.url));

    return true;
}
