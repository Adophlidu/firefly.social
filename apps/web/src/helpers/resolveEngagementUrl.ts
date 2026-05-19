import { SORTED_ENGAGEMENT_TAB_TYPE } from '@dimensiondev/constants/computed';
import type { SocialSource } from '@dimensiondev/enums';
import { EngagementType, Source } from '@dimensiondev/enums';
import { first } from 'lodash-es';
import urlcat from 'urlcat';

import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function resolveEngagementUrl(id: string, source: SocialSource, type: EngagementType) {
    return urlcat(`/post/:source/:id/:type`, {
        id,
        source: resolveSourceInUrl(source),
        type,
    });
}

export function resolvePostEngagementUrl({ postId, slug, source }: Post, type?: EngagementType) {
    const engagementType = type || first(SORTED_ENGAGEMENT_TAB_TYPE[source]) || EngagementType.Likes;

    return resolveEngagementUrl(slug && source === Source.Lens ? slug : postId, source, engagementType);
}
