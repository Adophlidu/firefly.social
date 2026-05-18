import { Source } from '@dimensiondev/enums';
import type { Channel } from '@/providers/types/SocialMedia.js';
import type { Channel as WarpcastChannel } from '@/providers/types/Warpcast.js';

export function formatFarcasterChannelFromWarpcast(channel: WarpcastChannel): Channel {
    return {
        source: Source.Farcaster,
        id: channel.id,
        name: channel.name,
        description: channel.description,
        imageUrl: channel.imageUrl,
        url: channel.url,
        parentUrl: '',
        followerCount: channel.followerCount ?? 0,
        timestamp: (channel.createdAt || 0) * 1000,
        lead: undefined,
        isMember: false,
        __original__: channel,
    };
}
