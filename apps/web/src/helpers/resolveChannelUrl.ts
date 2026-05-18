import type { SocialSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import urlcat from 'urlcat';

import { ChannelTabType } from '@/constants/enum.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';

export function resolveChannelUrl(id: string, source?: SocialSource, type = ChannelTabType.Posts) {
    return urlcat(`/club/:source/:id/:type`, {
        id,
        type,
        source: resolveSourceInUrl(source ?? Source.Farcaster),
    });
}
