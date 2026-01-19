import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { ChannelAtUri } from '@/providers/bsky/AtUri.js';
import { formatBskyFeedPost } from '@/providers/bsky/formatBskyFeedPost.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { type Post } from '@/providers/types/SocialMedia.js';

export async function getBskyPostsByChannelId(
    channelId: string,
    indicator?: PageIndicator,
): Promise<Pageable<Post, PageIndicator>> {
    const atUri = ChannelAtUri.fromId(channelId).toUri();
    const response = await bskySessionHolder.agent.app.bsky.feed.getFeed({
        feed: atUri,
        cursor: indicator?.id,
    });
    const data = resolveBskyResponseData(response, 'Failed to get posts');
    return createPageable(
        data.feed.map(formatBskyFeedPost),
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
    );
}
