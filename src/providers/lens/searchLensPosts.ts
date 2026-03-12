import { PageSize } from '@lens-protocol/client';
import { fetchPosts } from '@lens-protocol/client/actions';

import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { ensureCursor } from '@/providers/lens/ensureCursor.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { formatLensPostV3 } from '@/providers/lens/formatLensPost.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';
import { type Post } from '@/providers/types/SocialMedia.js';

function resolveLensPageSize(size?: number) {
    return size && size <= 10 ? PageSize.Ten : PageSize.Fifty;
}

export async function searchLensPosts(q: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
    const result = await ensureLensResult(
        fetchPosts(getLensClient(), {
            cursor: ensureCursor(indicator),
            pageSize: resolveLensPageSize(indicator?.size),
            filter: {
                metadata: null,
                searchQuery: q,
            },
        }),
    );
    return createPageable(
        result.items.map(formatLensPostV3),
        createIndicator(indicator),
        result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
    );
}
