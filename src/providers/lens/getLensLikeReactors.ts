import { type Account, PageSize, PostReactionType } from '@lens-protocol/client';
import { fetchPostReactions } from '@lens-protocol/client/actions';

import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { ensureCursor } from '@/providers/lens/ensureCursor.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { formatLensProfileV3 } from '@/providers/lens/formatLensProfile.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';

export async function getLensLikeReactors(postId: string, indicator?: PageIndicator) {
    const result = await ensureLensResult(
        fetchPostReactions(getLensClient(), {
            cursor: ensureCursor(indicator),
            pageSize: PageSize.Fifty,
            post: postId,
            filter: {
                anyOf: [PostReactionType.Upvote],
            },
        }),
    );
    if (!result) throw new Error('No one likes this post yet.');
    const profiles = result.items.map((item) => formatLensProfileV3(item.account as Account));
    return createPageable(
        profiles,
        createIndicator(indicator),
        result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
    );
}
