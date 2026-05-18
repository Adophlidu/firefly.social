import { Source } from '@dimensiondev/enums';
import type { AppBskyFeedDefs } from '@atproto/api';

import { ChannelAtUri } from '@/providers/bsky/AtUri.js';
import { formatBskyProfile } from '@/providers/bsky/formatBskyProfile.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

export function formatBskyChannel(original: AppBskyFeedDefs.GeneratorView): Channel {
    return {
        source: Source.Bsky,
        id: ChannelAtUri.from(original.uri).toId(),
        name: original.displayName,
        description: original.description,
        imageUrl: original.avatar || '',
        url: original.uri,
        __original__: original,
        timestamp: new Date(original.indexedAt).getTime(),
        parentUrl: original.uri,
        followerCount: original.likeCount || 0,
        lead: formatBskyProfile(original.creator),
        blocked: false,
        isMember: !!original.viewer?.like,
        canJoin: true,
    };
}
