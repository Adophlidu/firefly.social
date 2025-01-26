import { safeUnreachable } from '@masknet/kit';

import { Source } from '@/constants/enum.js';
import { resolveChannelUrl } from '@/helpers/resolveChannelUrl.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

export function getChannelUrl(channel: Channel) {
    switch (channel.source) {
        case Source.Lens:
        case Source.Farcaster:
            if (!channel.id) return '';
            return resolveChannelUrl(channel.id, channel.source);
        case Source.Twitter:
            return '';
        case Source.Bsky:
            return '';
        default:
            safeUnreachable(channel.source);
            return '';
    }
}
