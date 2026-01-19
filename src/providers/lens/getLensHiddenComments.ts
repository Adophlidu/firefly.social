import { PageSize, PostReferenceType, PostVisibilityFilter, ReferenceRelevancyFilter } from '@lens-protocol/client';
import { fetchPostReferences } from '@lens-protocol/client/actions';

import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { ensureCursor } from '@/providers/lens/ensureCursor.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { formatLensPostV3 } from '@/providers/lens/formatLensPost.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';

export async function getLensHiddenComments(postId: string, indicator?: PageIndicator) {
    const result = await ensureLensResult(
        fetchPostReferences(getLensClient(), {
            cursor: ensureCursor(indicator),
            pageSize: PageSize.Fifty,
            referenceTypes: [PostReferenceType.CommentOn],
            referencedPost: postId,
            relevancyFilter: ReferenceRelevancyFilter.NotRelevant,
            visibilityFilter: PostVisibilityFilter.Visible,
        }),
    );

    if (!result) throw new Error('No comments found');

    return createPageable(
        result.items.map(formatLensPostV3),
        createIndicator(indicator),
        result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
    );
}
