import urlcat from 'urlcat';

import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveSearchKeyword } from '@/helpers/resolveSearchKeyword.js';
import { formatFarcasterPostFromFirefly } from '@/providers/farcaster/formatFarcasterPostFromFirefly.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type SearchCastsResponse } from '@/providers/types/Firefly.js';
import { type Post } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function searchPosts(
    q: string,
    fullMatch?: boolean,
    indicator?: PageIndicator,
): Promise<Pageable<Post, PageIndicator>> {
    const { handle, content } = resolveSearchKeyword(q);
    return farcasterSessionHolder.withSession(async (session) => {
        const page = indicator?.id || '1';
        const url = urlcat(
            settings.FIREFLY_ROOT_URL,
            fullMatch ? '/v2/farcaster-hub/cast/searchfull' : '/v2/farcaster-hub/cast/search',
            {
                keyword: content,
                fidHandle: handle,
                limit: 25,
                sourceFid: session?.profileId,
                page,
            },
        );
        const response = await fireflySessionHolder.fetch<SearchCastsResponse>(url);
        const data = resolveFireflyResponseData(response);
        const casts = Array.isArray(data) ? data : data.casts;
        const posts = casts.map((cast) => formatFarcasterPostFromFirefly(cast));
        return createPageable(
            posts,
            createIndicator(indicator),
            casts.length ? createNextIndicator(indicator, `${+page + 1}`) : undefined,
        );
    });
}
