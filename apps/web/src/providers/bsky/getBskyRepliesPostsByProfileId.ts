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

export async function getBskyRepliesPostsByProfileId(
    profileId: string,
    indicator?: PageIndicator,
    signal?: AbortSignal,
): Promise<Pageable<Post, PageIndicator>> {
    const response = await bskySessionHolder.agent.getAuthorFeed(
        {
            actor: profileId,
            filter: 'posts_with_replies',
            cursor: indicator?.id,
        },
        { signal },
    );
    const data = resolveBskyResponseData(response, `Failed to get replies post by profile id = ${profileId}.`);
    return createPageable(
        data.feed.map(formatBskyFeedPost).filter((x) => x.type !== 'Mirror'),
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
    );
}
