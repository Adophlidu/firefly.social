import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { formatBskyChannel } from '@/providers/bsky/formatBskyChannel.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

export async function searchBskyChannels(
    q: string,
    indicator?: PageIndicator,
    signal?: AbortSignal,
): Promise<Pageable<Channel, PageIndicator>> {
    const response = await bskySessionHolder.agent.app.bsky.unspecced.getPopularFeedGenerators(
        {
            limit: 20,
            query: q,
            cursor: indicator?.id,
        },
        { signal },
    );
    const data = resolveBskyResponseData(response, `Failed to search channels by query = ${q}.`);

    return createPageable(
        data.feeds.map(formatBskyChannel),
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
    );
}
