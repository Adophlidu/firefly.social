import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@dimensiondev/utils';
import { PageSize } from '@lens-protocol/client';
import { fetchPosts } from '@lens-protocol/client/actions';
import { compact } from 'lodash-es';

import { lpt1EventQueryTags } from '@/helpers/lpt1.js';
import { ensureCursor } from '@/providers/lens/ensureCursor.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { filterFeedsV3, formatLensPostV3 } from '@/providers/lens/formatLensPost.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';
import type { Post } from '@/providers/types/SocialMedia.js';

/**
 * Fetch Firefly LPT-1 Orb comments scoped to a single Polymarket event, in
 * reverse-chronological order (SDK default). Matches posts carrying the app tag,
 * the polymarket source tag, and the event's direct item tag.
 */
export async function getLensPostsByLpt1Item(
    eventSlug: string,
    indicator?: PageIndicator,
): Promise<Pageable<Post, PageIndicator>> {
    const result = await ensureLensResult(
        fetchPosts(getLensClient(), {
            cursor: ensureCursor(indicator),
            pageSize: PageSize.Fifty,
            filter: {
                metadata: {
                    tags: { all: lpt1EventQueryTags(eventSlug) },
                },
            },
        }),
    );

    return createPageable(
        filterFeedsV3(compact(result.items)).map(formatLensPostV3),
        createIndicator(indicator),
        result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
    );
}
