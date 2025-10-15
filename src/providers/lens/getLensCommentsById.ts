import { PageSize, PostReferenceType, PostVisibilityFilter, ReferenceRelevancyFilter } from '@lens-protocol/client';
import { fetchPostReferences } from '@lens-protocol/client/actions';

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

export async function getLensCommentsById(
    postId: string,
    indicator?: PageIndicator,
    hasFilter = true,
): Promise<Pageable<Post, PageIndicator>> {
    const result = await ensureLensResult(
        fetchPostReferences(getLensClient(), {
            cursor: ensureCursor(indicator),
            pageSize: PageSize.Fifty,
            referencedPost: postId,
            referenceTypes: [PostReferenceType.CommentOn],
            relevancyFilter: hasFilter ? ReferenceRelevancyFilter.Relevant : ReferenceRelevancyFilter.All,
            visibilityFilter: hasFilter ? PostVisibilityFilter.Visible : PostVisibilityFilter.All,
        }),
    );

    return createPageable(
        result.items.map(formatLensPostV3),
        createIndicator(indicator),
        result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
    );
}
