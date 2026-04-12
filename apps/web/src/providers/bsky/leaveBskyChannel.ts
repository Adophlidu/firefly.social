import { AppBskyActorDefs } from '@atproto/api';

import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

export async function leaveBskyChannel(channel: Channel, signal?: AbortSignal): Promise<boolean> {
    const response = await bskySessionHolder.agent.app.bsky.actor.getPreferences({}, { signal });

    const savedFeedsPref = [...response.data.preferences].reverse().find(AppBskyActorDefs.isSavedFeedsPrefV2);
    const savedFeeds: AppBskyActorDefs.SavedFeed[] = savedFeedsPref?.items ?? [];
    const result = savedFeeds.find((x) => x.value === channel.url);
    if (!result) return false;

    const newSavedFeeds = savedFeeds.filter((x) => x.value !== channel.url);
    const newPreferences = response.data.preferences.map((p) =>
        AppBskyActorDefs.isSavedFeedsPrefV2(p) ? { ...p, items: newSavedFeeds } : p,
    );
    await bskySessionHolder.agent.app.bsky.actor.putPreferences({ preferences: newPreferences }, { signal });

    return true;
}
