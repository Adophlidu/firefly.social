import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@dimensiondev/utils';

import { formatBskyFeedPost } from '@/providers/bsky/formatBskyFeedPost.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export async function discoverBskyPostsById(
    profileId: string,
    indicator?: PageIndicator,
    signal?: AbortSignal,
): Promise<Pageable<Post, PageIndicator>> {
    const response = await bskySessionHolder.agent.getTimeline(
        {
            cursor: indicator?.id,
        },
        {
            signal,
        },
    );
    const data = resolveBskyResponseData(response, 'Failed to discoverPosts');
    return createPageable(
        data.feed.map(formatBskyFeedPost),
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
    );
}
