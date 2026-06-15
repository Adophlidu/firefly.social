import { uiSuggestedChannelsWorker } from '@dimensiondev/workers-client';
import type { SuggestedChannel } from '@dimensiondev/workers-ui-suggested-channels';

import { formatSuggestedChannel } from '@/helpers/formatSuggestedChannel.js';
import type { Channel } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function getTrendingChannels(): Promise<Channel[]> {
    const res = await uiSuggestedChannelsWorker.ui['suggested-channels'].$get(
        { query: {} },
        { headers: { 'X-DEVELOPMENT-API': settings.dev ? 'true' : 'false' } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.success) return [];
    return (json.data as SuggestedChannel[]).map(formatSuggestedChannel);
}
