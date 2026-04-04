import { PageSize } from '@lens-protocol/client';
import { fetchPostBookmarks } from '@lens-protocol/client/actions';

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
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';
import { type Post } from '@/providers/types/SocialMedia.js';

export async function getLensBookmarks(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
    const result = await ensureLensResult(
        fetchPostBookmarks(lensSessionClientHolder.sessionClient, {
            cursor: ensureCursor(indicator),
            pageSize: PageSize.Fifty,
        }),
    );
    const posts = result.items.map(formatLensPostV3);
    return createPageable(
        posts,
        createIndicator(indicator),
        result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
    );
}
