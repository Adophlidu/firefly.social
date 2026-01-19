import { PageSize, PostType } from '@lens-protocol/client';
import { fetchPosts } from '@lens-protocol/client/actions';

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
import { formatLensPostV3 } from '@/providers/lens/formatLensPost.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';
import { type Post } from '@/providers/types/SocialMedia.js';

export async function getLensPostsReplies(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post>> {
    const result = await ensureLensResult(
        fetchPosts(getLensClient(), {
            cursor: ensureCursor(indicator),
            pageSize: PageSize.Fifty,
            filter: {
                metadata: null,
                authors: [safeEvmAddress(profileId)],
                postTypes: [PostType.Comment],
            },
        }),
    );

    return createPageable(
        result.items.map(formatLensPostV3),
        createIndicator(indicator),
        result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
    );
}
