import { TimelineEventItemType } from '@lens-protocol/client';
import { fetchTimeline } from '@lens-protocol/client/actions';
import { compact } from 'lodash-es';

import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { ensureCursor } from '@/providers/lens/ensureCursor.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { formatLensPostByFeedV3 } from '@/providers/lens/formatLensPost.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export async function discoverLensPostsById(
    profileId: string,
    indicator?: PageIndicator,
): Promise<Pageable<Post, PageIndicator>> {
    const result = await ensureLensResult(
        fetchTimeline(lensSessionClientHolder.sessionClient, {
            cursor: ensureCursor(indicator),
            filter: {
                eventType: [TimelineEventItemType.Post, TimelineEventItemType.Quote, TimelineEventItemType.Repost],
            },
            account: safeEvmAddress(profileId),
        }),
    );

    const posts = compact(result.items.map(formatLensPostByFeedV3)).filter(
        (post) => !post.author.viewerContext?.blocking && !post.hasReported,
    );
    return createPageable(
        posts,
        createIndicator(indicator),
        result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
    );
}
