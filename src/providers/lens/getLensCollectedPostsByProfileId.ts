import { PageSize } from '@lens-protocol/client';
import { fetchPosts } from '@lens-protocol/client/actions';
import { uniqWith } from 'lodash-es';

import { isSamePost } from '@/helpers/isSamePost.js';
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

export async function getLensCollectedPostsByProfileId(
    profileId: string,
    indicator?: PageIndicator,
): Promise<Pageable<Post, PageIndicator>> {
    const result = await ensureLensResult(
        fetchPosts(getLensClient(), {
            cursor: ensureCursor(indicator),
            pageSize: PageSize.Fifty,
            filter: {
                metadata: null,
                collectedBy: {
                    account: safeEvmAddress(profileId),
                },
            },
        }),
    );

    const posts = uniqWith(result.items.map(formatLensPostV3), isSamePost);
    return createPageable(
        posts,
        createIndicator(indicator),
        result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
    );
}
