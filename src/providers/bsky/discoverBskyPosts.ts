import { DISCOVER_AT_URI } from '@/constants/bsky.js';
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

export async function discoverBskyPosts(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
    const response = await bskySessionHolder.agent.app.bsky.feed.getFeed({
        feed: DISCOVER_AT_URI,
        cursor: indicator?.id,
    });
    const data = resolveBskyResponseData(response, 'Failed to discoverPosts');

    return createPageable(
        data.feed.map(formatBskyFeedPost),
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
    );
}
