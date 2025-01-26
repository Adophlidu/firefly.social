import urlcat from 'urlcat';

import { type SocialSource, Source } from '@/constants/enum.js';
import { resolveSocialSourceInUrl } from '@/helpers/resolveSourceInUrl.js';

export function resolveChannelUrl(id: string, source?: SocialSource) {
    return urlcat(`/channel/:source/:id`, {
        id,
        source: resolveSocialSourceInUrl(source ?? Source.Farcaster),
    });
}
