import { Source } from '@/constants/enum.js';
import { formatFarcasterProfileFromNeynar } from '@/providers/farcaster/formatFarcasterProfileFromNeynar.js';
import type { Channel as NeynarChannel } from '@/providers/types/Neynar.js';
import { type Channel } from '@/providers/types/SocialMedia.js';

export function formatFarcasterChannelFromNeynar(channel: NeynarChannel): Channel {
    return {
        source: Source.Farcaster,
        id: channel.id,
        name: channel.name,
        description: channel.description,
        imageUrl: channel.image_url,
        url: channel.url,
        parentUrl: channel.parent_url,
        followerCount: channel.follower_count ?? 0,
        timestamp: (channel.created_at || 0) * 1000,
        lead: channel.lead ? formatFarcasterProfileFromNeynar(channel.lead) : undefined,
        isMember: channel.viewer_context?.following,
        __original__: channel,
    };
}
