import type { SuggestedChannel } from '@dimensiondev/workers-ui-suggested-channels';

import { resolveChannelUrl } from '@/helpers/resolveChannelUrl.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

export function formatSuggestedChannel(channel: SuggestedChannel): Channel {
    return {
        source: channel.source,
        id: channel.id,
        name: channel.name,
        description: channel.description ?? '',
        imageUrl: channel.imageUrl,
        url: resolveChannelUrl(channel.id, channel.source),
        parentUrl: '',
        followerCount: 0,
        timestamp: 0,
    };
}
