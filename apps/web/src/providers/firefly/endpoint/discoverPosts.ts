import urlcat from 'urlcat';

import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { formatFarcasterPostFromFirefly } from '@/providers/farcaster/formatFarcasterPostFromFirefly.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { CastsResponse } from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function discoverPosts(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
    return farcasterSessionHolder.withSession(async (session) => {
        const query: Record<string, string | number | undefined> = {
            size: 20,
            sourceFid: session?.profileId,
            needRootParentHash: 1,
        };
        if (indicator?.id) query.cursor = indicator?.id;
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/discover/farcaster/timeline', query);
        const response = await fireflySessionHolder.fetch<CastsResponse>(url);
        const data = resolveFireflyResponseData(response);
        const posts = data.casts.map((x) => formatFarcasterPostFromFirefly(x));

        return createPageable(
            posts,
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    });
}
