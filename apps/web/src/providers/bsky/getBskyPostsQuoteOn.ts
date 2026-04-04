import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { PostAtUri } from '@/providers/bsky/AtUri.js';
import { formatBskyPost } from '@/providers/bsky/formatBskyFeedPost.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { type Post } from '@/providers/types/SocialMedia.js';

export async function getBskyPostsQuoteOn(
    postId: string,
    indicator?: PageIndicator,
    signal?: AbortSignal,
): Promise<Pageable<Post, PageIndicator>> {
    const atUri = PostAtUri.fromId(postId).toUri();
    const response = await bskySessionHolder.agent.app.bsky.feed.getQuotes(
        {
            uri: atUri,
        },
        { signal },
    );
    const data = resolveBskyResponseData(response, `Failed to getPostsQuoteOn postId = ${postId}.`);
    return createPageable(
        data.posts.map((x) => formatBskyPost(x)),
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
    );
}
