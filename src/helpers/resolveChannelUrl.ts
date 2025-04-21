import urlcat from 'urlcat';

import { ChannelTabType, type SocialSource, Source } from '@/constants/enum.js';
import { resolveSocialSourceInUrl } from '@/helpers/resolveSourceInUrl.js';

export function resolveChannelUrl(id: string, source?: SocialSource, type = ChannelTabType.Posts) {
    return urlcat(`/channel/:source/:id/:type`, {
        id,
        type,
        source: resolveSocialSourceInUrl(source ?? Source.Farcaster),
    });
}
