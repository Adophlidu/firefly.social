import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@dimensiondev/utils';
import { PageSize, PostReferenceType } from '@lens-protocol/client';
import { fetchWhoReferencedPost } from '@lens-protocol/client/actions';

import { ensureCursor } from '@/providers/lens/ensureCursor.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { formatLensProfileV3 } from '@/providers/lens/formatLensProfile.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';

export async function getLensRepostReactors(postId: string, indicator?: PageIndicator) {
    const result = await ensureLensResult(
        fetchWhoReferencedPost(getLensClient(), {
            cursor: ensureCursor(indicator),
            pageSize: PageSize.Fifty,
            post: postId,
            referenceTypes: [PostReferenceType.RepostOf],
        }),
    );
    if (!result) throw new Error('No one likes this post yet.');
    const profiles = result.items.map(formatLensProfileV3);
    return createPageable(
        profiles,
        createIndicator(indicator),
        result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
    );
}
