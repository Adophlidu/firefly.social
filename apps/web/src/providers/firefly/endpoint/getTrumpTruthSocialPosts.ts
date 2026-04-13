import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { formatPostsFromTruthSocial } from '@/helpers/formatPostsFromTruthSocial.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { TrumpTruthSocialPostsResponse } from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function getTrumpTruthSocialPosts(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/discover/truthsocial_trump_timeline', {
        size: 25,
        cursor: indicator?.id,
    });
    const response = await fireflySessionHolder.fetch<TrumpTruthSocialPostsResponse>(url);
    const posts = (response.data?.result || []).filter((x) => !x.has_reblog).map(formatPostsFromTruthSocial);

    return createPageable(
        posts,
        createIndicator(indicator),
        response.data?.cursor ? createNextIndicator(indicator, response.data.cursor) : undefined,
    );
}
