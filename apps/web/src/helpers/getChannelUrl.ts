import { Source } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { resolveChannelUrl } from '@/helpers/resolveChannelUrl.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

export function getChannelUrl(channel: Channel) {
    switch (channel.source) {
        case Source.Lens:
        case Source.Farcaster:
        case Source.Bsky:
            if (!channel.id) return '';
            return resolveChannelUrl(channel.id, channel.source);
        case Source.Twitter:
            return '';
        default:
            safeUnreachable(channel.source);
            return '';
    }
}

/** The bare `/club/:source/:id` shape (no `:type` tab suffix) — matches the short-link `club` kind's route. */
export function getClubShareUrl(channel: Channel) {
    switch (channel.source) {
        case Source.Lens:
        case Source.Farcaster:
        case Source.Bsky:
            if (!channel.id) return '';
            return urlcat('/club/:source/:id', { source: resolveSourceInUrl(channel.source), id: channel.id });
        case Source.Twitter:
            return '';
        default:
            safeUnreachable(channel.source);
            return '';
    }
}
