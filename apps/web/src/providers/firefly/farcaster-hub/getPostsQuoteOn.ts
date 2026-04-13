import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { formatFarcasterPostFromFirefly } from '@/providers/farcaster/formatFarcasterPostFromFirefly.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { PostQuotesResponse } from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function getPostsQuoteOn(
    postId: string,
    indicator?: PageIndicator,
): Promise<Pageable<Post, PageIndicator>> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/cast/quotes', {
        hash: postId,
        size: 20,
        cursor: indicator?.id,
        needRootParentHash: true,
    });
    const response = await fireflySessionHolder.fetch<PostQuotesResponse>(url);
    const data = resolveFireflyResponseData(response);
    const posts = data.quotes.map((x) => formatFarcasterPostFromFirefly(x));

    return createPageable(
        posts,
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
    );
}
