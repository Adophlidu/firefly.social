import { PageSize, PostReferenceType } from '@lens-protocol/client';
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
import type { Post } from '@/providers/types/SocialMedia.js';

export async function getCommentsByProfileId(
    postId: string,
    profileId: string,
    indicator?: PageIndicator,
): Promise<Pageable<Post, PageIndicator>> {
    const result = await ensureLensResult(
        fetchPostReferences(getLensClient(), {
            cursor: ensureCursor(indicator),
            pageSize: PageSize.Fifty,
            referencedPost: postId,
            referenceTypes: [PostReferenceType.CommentOn],
        }),
    );
    if (!result) return createPageable([], createIndicator(indicator));

    const posts = result.items.map(formatLensPostV3);
    return createPageable(
        posts,
        createIndicator(indicator),
        result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
    );
}
