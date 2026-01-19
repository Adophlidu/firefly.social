import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { formatBskyFeedPost } from '@/providers/bsky/formatBskyFeedPost.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { type Post } from '@/providers/types/SocialMedia.js';

export async function searchBskyPosts(q: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
    const response = await bskySessionHolder.agent.app.bsky.feed.searchPosts({
        q,
        sort: 'latest',
        limit: 25,
        cursor: indicator?.id,
    });
    const data = resolveBskyResponseData(response, `Failed to search posts by query = ${q}.`);

    return createPageable(
        data.posts.map((x) => formatBskyFeedPost({ post: x })),
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
    );
}
