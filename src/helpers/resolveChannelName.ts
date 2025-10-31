import { safeUnreachable } from '@dimensiondev/utils';

import { type SocialSource, Source } from '@/constants/enum.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

function getChannelName(source: SocialSource, name: string, channelPrefix = true) {
    if (!channelPrefix || !name) return name;

    switch (source) {
        case Source.Lens:
        case Source.Bsky:
            return `#${name}`;
        case Source.Farcaster:
        case Source.Twitter:
            return `/${name}`;
        default:
            safeUnreachable(source);
            return name;
    }
}

export function resolveChannelName(channel: Channel, channelPrefix = true) {
    return getChannelName(channel.source, channel.name, channelPrefix);
}
