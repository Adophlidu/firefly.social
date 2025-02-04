import type { AppBskyFeedDefs } from '@atproto/api';

import { Source } from '@/constants/enum.js';
import { formatBskyProfile } from '@/helpers/formatBskyProfile.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

export function formatBskyChannels(original: AppBskyFeedDefs.GeneratorView): Channel {
    return {
        source: Source.Bsky,
        id: original.did,
        name: original.displayName,
        description: original.description,
        imageUrl: original.avatar || '',
        url: original.uri,
        __original__: original,
        timestamp: new Date(original.indexedAt).getTime(),
        parentUrl: original.uri,
        followerCount: original.likeCount || 0,
        lead: formatBskyProfile(original.creator),
        blocked: original.viewer?.muted as boolean,
        isMember: !!original.viewer?.following,
        canJoin: true,
    };
}
