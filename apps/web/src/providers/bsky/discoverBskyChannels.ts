import { BSKY_LOGIN_REQUIRED_FEEDS } from '@dimensiondev/constants/static';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@dimensiondev/utils';

import { formatBskyChannel } from '@/providers/bsky/formatBskyChannel.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

export async function discoverBskyChannels(
    indicator?: PageIndicator,
    signal?: AbortSignal,
): Promise<Pageable<Channel, PageIndicator>> {
    const response = await bskySessionHolder.agent.app.bsky.unspecced.getPopularFeedGenerators(
        {
            cursor: indicator?.id,
            limit: 20,
        },
        { signal },
    );
    const data = resolveBskyResponseData(response, 'Failed to discoverChannels');
    const result = bskySessionHolder.session
        ? data.feeds
        : data.feeds.filter((x) => !BSKY_LOGIN_REQUIRED_FEEDS.includes(x.uri));
    return createPageable(
        result.map(formatBskyChannel),
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
    );
}
