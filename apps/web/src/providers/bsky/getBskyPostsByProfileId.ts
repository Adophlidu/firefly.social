import { BlockedActorError } from '@atproto/api/dist/client/types/app/bsky/feed/getAuthorFeed.js';
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

export async function getBskyPostsByProfileId(
    profileId: string,
    indicator?: PageIndicator,
    signal?: AbortSignal,
): Promise<Pageable<Post, PageIndicator>> {
    try {
        const response = await bskySessionHolder.agent.getAuthorFeed(
            {
                actor: profileId,
                filter: 'posts_and_author_threads',
                cursor: indicator?.id,
            },
            { signal },
        );
        const data = resolveBskyResponseData(response, `Failed to get post by profile id = ${profileId}.`);
        return createPageable(
            data.feed.map(formatBskyFeedPost),
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    } catch (error) {
        if (error instanceof BlockedActorError) {
            return createPageable([], createIndicator(indicator), undefined);
        }
        throw error;
    }
}
