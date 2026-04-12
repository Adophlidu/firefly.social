import { PageSize } from '@lens-protocol/client';
import { fetchPosts } from '@lens-protocol/client/actions';
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
import { filterFeedsV3, formatLensPostV3 } from '@/providers/lens/formatLensPost.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export async function getLensPostsByChannelId(
    channelId: string,
    indicator?: PageIndicator,
): Promise<Pageable<Post, PageIndicator>> {
    const result = await ensureLensResult(
        fetchPosts(getLensClient(), {
            cursor: ensureCursor(indicator),
            pageSize: indicator?.size && indicator.size <= 10 ? PageSize.Ten : PageSize.Fifty,
            filter: {
                feeds: [{ feed: safeEvmAddress(channelId) }],
                metadata: null,
            },
        }),
    );

    return createPageable(
        filterFeedsV3(compact(result.items)).map(formatLensPostV3),
        createIndicator(indicator),
        result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
    );
}
