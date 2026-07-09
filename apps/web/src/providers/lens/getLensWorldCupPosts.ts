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

import { WORLD_CUP_TAG } from '@/helpers/lpt1.js';
import { ensureCursor } from '@/providers/lens/ensureCursor.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { filterFeedsV3, formatLensPostV3 } from '@/providers/lens/formatLensPost.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';
import type { Post } from '@/providers/types/SocialMedia.js';

/**
 * Fetch all World Cup posts in reverse-chronological order (SDK default), keyed
 * on the bare `worldcup` tag. This surfaces BOTH Firefly Orb comments (which we
 * tag `worldcup` for interop) AND Orb's World Cup posts (Orb uses only `worldcup`).
 * Powers the Home "World Cup" tab.
 */
export async function getLensWorldCupPosts(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
    const result = await ensureLensResult(
        fetchPosts(getLensClient(), {
            cursor: ensureCursor(indicator),
            pageSize: PageSize.Fifty,
            filter: {
                metadata: {
                    tags: { all: [WORLD_CUP_TAG] },
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
